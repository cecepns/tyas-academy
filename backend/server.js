const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
// Slug helper - no external library
const slugify = (text) => {
  if (text == null || text === "") return "";
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");
const CryptoJS = require("crypto-js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Midtrans – hanya dari env, jangan hardcode key di sini
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_SNAP_BASE_URL =
  process.env.MIDTRANS_SNAP_BASE_URL || "https://app.midtrans.com/snap/v1";

// Static uploads folder
const uploadsDir = path.join(__dirname, "uploads-tyasacademy");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads-tyasacademy", express.static(uploadsDir));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Strip base path (production: /tyasacademy/api/... -> /api/...)
const API_BASE_PATH = process.env.API_BASE_PATH || "/tyasacademy";
app.use((req, res, next) => {
  if (!API_BASE_PATH) return next();
  const pathOnly = req.path || req.url.split("?")[0];
  if (pathOnly.startsWith(API_BASE_PATH)) {
    const newPath = pathOnly.slice(API_BASE_PATH.length) || "/";
    const q = req.url.includes("?") ? "?" + req.url.split("?").slice(1).join("?") : "";
    req.url = newPath + q;
  }
  next();
});

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${Date.now()}-${slugify(base)}${ext}`);
  },
});

const upload = multer({ storage });

// DB connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tyasacademy",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helpers
const generateSlug = (text) => slugify(text || "");

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || "tyasacademy_secret", {
    expiresIn: "7d",
  });

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = header.split(" ")[1];
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "tyasacademy_secret"
      );
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};

const buildPagination = (req) => {
  const page = parseInt(req.query.page || "1", 10);
  const limit = parseInt(req.query.limit || "10", 10);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

// ---------- AUTH ----------

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }
  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length) {
      return res.status(400).json({ message: "Email already used" });
    }
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hash, "user"]
    );
    const token = signToken({
      id: result.insertId,
      name,
      email,
      role: "user",
    });
    res.json({ token, user: { id: result.insertId, name, email, role: "user" } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password, asAdmin } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (!rows.length) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const user = rows[0];
    if (asAdmin && user.role !== "admin") {
      return res.status(403).json({ message: "Not an admin account" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- GENERIC LIST HANDLER ----------

const listWithSearch = async (req, res, table, searchColumns = []) => {
  const { limit, offset } = buildPagination(req);
  const search = req.query.search || "";
  try {
    let where = "";
    const params = [];
    if (search && searchColumns.length) {
      const like = `%${search}%`;
      where =
        "WHERE " +
        searchColumns.map((c) => `${c} LIKE ?`).join(" OR ");
      for (let i = 0; i < searchColumns.length; i++) params.push(like);
    }
    const [rows] = await pool.query(
      `SELECT * FROM ${table} ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM ${table} ${where}`,
      params
    );
    res.json({
      data: rows,
      total: countRows[0].total,
      page: parseInt(req.query.page || "1", 10),
      limit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------- USERS (ADMIN) ----------

app.get("/api/admin/users", authMiddleware(["admin"]), async (req, res) => {
  await listWithSearch(req, res, "users", ["name", "email", "role"]);
});

app.post("/api/admin/users", authMiddleware(["admin"]), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Missing fields" });
  }
  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length) {
      return res.status(400).json({ message: "Email already used" });
    }
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hash, role]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/admin/users/:id", authMiddleware(["admin"]), async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ message: "Missing fields" });
  }
  try {
    const params = [name, email, role];
    let setPassword = "";
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      setPassword = ", password = ?";
      params.push(hash);
    }
    params.push(id);
    await pool.query(
      `UPDATE users SET name = ?, email = ?, role = ?${setPassword} WHERE id = ?`,
      params
    );
    res.json({ message: "Updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete(
  "/api/admin/users/:id",
  authMiddleware(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM users WHERE id = ?", [id]);
      res.json({ message: "Deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ---------- TIPE SOAL ----------

app.get(
  "/api/admin/tipe-soal",
  authMiddleware(["admin"]),
  async (req, res) => {
    await listWithSearch(req, res, "tipe_soal", ["kode_soal", "nama_tipe_soal"]);
  }
);

app.get(
  "/api/admin/tipe-soal/all",
  authMiddleware(["admin", "user"]),
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        "SELECT id, kode_soal, nama_tipe_soal, passing_grade FROM tipe_soal ORDER BY nama_tipe_soal ASC"
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.post(
  "/api/admin/tipe-soal",
  authMiddleware(["admin"]),
  async (req, res) => {
    const { kode_soal, nama_tipe_soal, passing_grade } = req.body;
    if (!nama_tipe_soal || passing_grade == null) {
      return res.status(400).json({ message: "Missing fields" });
    }
    try {
      let kode = kode_soal;
      if (!kode) {
        const [rows] = await pool.query(
          "SELECT MAX(id) as maxId FROM tipe_soal"
        );
        const nextId = (rows[0].maxId || 0) + 1;
        kode = `TS-${String(nextId).padStart(4, "0")}`;
      }
      const [result] = await pool.query(
        "INSERT INTO tipe_soal (kode_soal, nama_tipe_soal, passing_grade) VALUES (?, ?, ?)",
        [kode, nama_tipe_soal, passing_grade]
      );
      res.json({ id: result.insertId, kode_soal: kode });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.put(
  "/api/admin/tipe-soal/:id",
  authMiddleware(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    const { nama_tipe_soal, passing_grade } = req.body;
    if (!nama_tipe_soal || passing_grade == null) {
      return res.status(400).json({ message: "Missing fields" });
    }
    try {
      await pool.query(
        "UPDATE tipe_soal SET nama_tipe_soal = ?, passing_grade = ? WHERE id = ?",
        [nama_tipe_soal, passing_grade, id]
      );
      res.json({ message: "Updated" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.delete(
  "/api/admin/tipe-soal/:id",
  authMiddleware(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM tipe_soal WHERE id = ?", [id]);
      res.json({ message: "Deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ---------- BANK SOAL & OPSI ----------

app.get(
  "/api/admin/bank-soal",
  authMiddleware(["admin"]),
  async (req, res) => {
    const { limit, offset } = buildPagination(req);
    const search = req.query.search || "";
    try {
      const like = `%${search}%`;
      const [rows] = await pool.query(
        `SELECT b.*, t.nama_tipe_soal
         FROM bank_soal b
         LEFT JOIN tipe_soal t ON b.tipe_soal_id = t.id
         WHERE b.soal LIKE ? OR t.nama_tipe_soal LIKE ?
         ORDER BY b.id DESC
         LIMIT ? OFFSET ?`,
        [like, like, limit, offset]
      );
      const [countRows] = await pool.query(
        `SELECT COUNT(*) as total
         FROM bank_soal b
         LEFT JOIN tipe_soal t ON b.tipe_soal_id = t.id
         WHERE b.soal LIKE ? OR t.nama_tipe_soal LIKE ?`,
        [like, like]
      );
      res.json({
        data: rows,
        total: countRows[0].total,
        page: parseInt(req.query.page || "1", 10),
        limit,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.get(
  "/api/admin/bank-soal/:id",
  authMiddleware(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      const [rows] = await pool.query("SELECT * FROM bank_soal WHERE id = ?", [
        id,
      ]);
      if (!rows.length) {
        return res.status(404).json({ message: "Not found" });
      }
      const soal = rows[0];
      const [options] = await pool.query(
        "SELECT * FROM opsi_jawaban WHERE bank_soal_id = ? ORDER BY label ASC",
        [id]
      );
      res.json({ ...soal, opsi: options });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.post(
  "/api/admin/bank-soal",
  authMiddleware(["admin"]),
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        tipe_soal_id,
        soal,
        pembahasan,
        opsi,
      } = req.body;

      if (!tipe_soal_id || !soal || !opsi) {
        return res.status(400).json({ message: "Missing fields" });
      }

      const opsiParsed = JSON.parse(opsi);
      if (opsiParsed.length < 2) {
        return res
          .status(400)
          .json({ message: "Minimal 2 opsi jawaban diperlukan" });
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const imagePath = req.file
          ? `/uploads-tyasacademy/${req.file.filename}`
          : null;
        const [result] = await conn.query(
          "INSERT INTO bank_soal (tipe_soal_id, soal, pembahasan, image_path) VALUES (?, ?, ?, ?)",
          [tipe_soal_id, soal, pembahasan || null, imagePath]
        );
        const bankId = result.insertId;

        for (const opt of opsiParsed) {
          await conn.query(
            "INSERT INTO opsi_jawaban (bank_soal_id, label, konten, skor, benar) VALUES (?, ?, ?, ?, ?)",
            [
              bankId,
              opt.label,
              opt.konten,
              opt.skor || 0,
              opt.benar ? 1 : 0,
            ]
          );
        }

        await conn.commit();
        res.json({ id: bankId });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.put(
  "/api/admin/bank-soal/:id",
  authMiddleware(["admin"]),
  upload.single("image"),
  async (req, res) => {
    const { id } = req.params;
    try {
      const { tipe_soal_id, soal, pembahasan, opsi } = req.body;
      if (!tipe_soal_id || !soal || !opsi) {
        return res.status(400).json({ message: "Missing fields" });
      }
      const opsiParsed = JSON.parse(opsi);
      if (opsiParsed.length < 2) {
        return res
          .status(400)
          .json({ message: "Minimal 2 opsi jawaban diperlukan" });
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        let imageClause = "";
        const params = [tipe_soal_id, soal, pembahasan || null];
        if (req.file) {
          imageClause = ", image_path = ?";
          params.push(`/uploads-tyasacademy/${req.file.filename}`);
        }
        params.push(id);
        await conn.query(
          `UPDATE bank_soal SET tipe_soal_id = ?, soal = ?, pembahasan = ?${imageClause} WHERE id = ?`,
          params
        );

        await conn.query("DELETE FROM opsi_jawaban WHERE bank_soal_id = ?", [
          id,
        ]);
        for (const opt of opsiParsed) {
          await conn.query(
            "INSERT INTO opsi_jawaban (bank_soal_id, label, konten, skor, benar) VALUES (?, ?, ?, ?, ?)",
            [
              id,
              opt.label,
              opt.konten,
              opt.skor || 0,
              opt.benar ? 1 : 0,
            ]
          );
        }
        await conn.commit();
        res.json({ message: "Updated" });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.delete(
  "/api/admin/bank-soal/:id",
  authMiddleware(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM opsi_jawaban WHERE bank_soal_id = ?", [id]);
      await pool.query("DELETE FROM bank_soal WHERE id = ?", [id]);
      res.json({ message: "Deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ---------- TRYOUT ----------

app.get("/api/admin/tryout", authMiddleware(["admin"]), async (req, res) => {
  await listWithSearch(req, res, "tryout", ["judul_tryout", "slug"]);
});

app.get("/api/admin/tryout/:id", authMiddleware(["admin"]), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM tryout WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    const tryout = rows[0];
    const [soal] = await pool.query(
      `SELECT ts.bank_soal_id, b.soal
       FROM tryout_soal ts
       JOIN bank_soal b ON ts.bank_soal_id = b.id
       WHERE ts.tryout_id = ?`,
      [id]
    );
    res.json({ ...tryout, soal: soal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post(
  "/api/admin/tryout",
  authMiddleware(["admin"]),
  upload.single("banner_image"),
  async (req, res) => {
    const { judul_tryout, slug, deskripsi, durasi, soal_ids } = req.body;
    if (!judul_tryout || !durasi) {
      return res.status(400).json({ message: "Missing fields" });
    }
    try {
      const finalSlug = slug || generateSlug(judul_tryout);
      const bannerPath = req.file
        ? `/uploads-tyasacademy/${req.file.filename}`
        : null;
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [result] = await conn.query(
          "INSERT INTO tryout (judul_tryout, slug, deskripsi, banner_image, durasi) VALUES (?, ?, ?, ?, ?)",
          [judul_tryout, finalSlug, deskripsi || null, bannerPath, durasi]
        );
        const tryoutId = result.insertId;
        if (soal_ids) {
          const ids = JSON.parse(soal_ids);
          for (const sid of ids) {
            await conn.query(
              "INSERT INTO tryout_soal (tryout_id, bank_soal_id) VALUES (?, ?)",
              [tryoutId, sid]
            );
          }
        }
        await conn.commit();
        res.json({ id: tryoutId, slug: finalSlug });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.put(
  "/api/admin/tryout/:id",
  authMiddleware(["admin"]),
  upload.single("banner_image"),
  async (req, res) => {
    const { id } = req.params;
    const { judul_tryout, slug, deskripsi, durasi, soal_ids } = req.body;
    if (!judul_tryout || !durasi) {
      return res.status(400).json({ message: "Missing fields" });
    }
    try {
      const finalSlug = slug || generateSlug(judul_tryout);
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        let bannerClause = "";
        const params = [judul_tryout, finalSlug, deskripsi || null, durasi];
        if (req.file) {
          bannerClause = ", banner_image = ?";
          params.push(`/uploads-tyasacademy/${req.file.filename}`);
        }
        params.push(id);
        await conn.query(
          `UPDATE tryout SET judul_tryout = ?, slug = ?, deskripsi = ?, durasi = ?${bannerClause} WHERE id = ?`,
          params
        );
        await conn.query("DELETE FROM tryout_soal WHERE tryout_id = ?", [id]);
        if (soal_ids) {
          const ids = JSON.parse(soal_ids);
          for (const sid of ids) {
            await conn.query(
              "INSERT INTO tryout_soal (tryout_id, bank_soal_id) VALUES (?, ?)",
              [id, sid]
            );
          }
        }
        await conn.commit();
        res.json({ message: "Updated" });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.delete(
  "/api/admin/tryout/:id",
  authMiddleware(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM tryout_soal WHERE tryout_id = ?", [id]);
      await pool.query("DELETE FROM tryout WHERE id = ?", [id]);
      res.json({ message: "Deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ---------- MATERI & KONTEN ----------

app.get("/api/admin/materi", authMiddleware(["admin"]), async (req, res) => {
  await listWithSearch(req, res, "materi", ["judul_materi", "slug"]);
});

app.get("/api/admin/materi/:id", authMiddleware(["admin"]), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM materi WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    const materi = rows[0];
    const [konten] = await pool.query(
      "SELECT * FROM materi_konten WHERE materi_id = ? ORDER BY id ASC",
      [id]
    );
    res.json({ ...materi, konten });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

const materiUpload = upload.fields([{ name: "banner_image", maxCount: 1 }, { name: "pdf_files", maxCount: 20 }]);

app.post(
  "/api/admin/materi",
  authMiddleware(["admin"]),
  materiUpload,
  async (req, res) => {
    const { judul_materi, slug, deskripsi, konten_materi } = req.body;
    if (!judul_materi) {
      return res.status(400).json({ message: "Missing fields" });
    }
    try {
      const finalSlug = slug || generateSlug(judul_materi);
      const bannerFile = req.files?.banner_image?.[0];
      const bannerPath = bannerFile
        ? `/uploads-tyasacademy/${bannerFile.filename}`
        : null;

      const kontenParsed = konten_materi ? JSON.parse(konten_materi) : [];
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [result] = await conn.query(
          "INSERT INTO materi (judul_materi, slug, deskripsi, banner_image) VALUES (?, ?, ?, ?)",
          [judul_materi, finalSlug, deskripsi || null, bannerPath]
        );
        const materiId = result.insertId;

        for (const item of kontenParsed) {
          if (item.tipe_materi === "video_link") {
            await conn.query(
              "INSERT INTO materi_konten (materi_id, tipe_materi, video_link) VALUES (?, ?, ?)",
              [materiId, "video_link", item.video_link]
            );
          } else if (item.tipe_materi === "pdf_file" && item.client_key) {
            const file = (req.files?.pdf_files || []).find(
              (f) => f.originalname === item.client_key
            );
            if (file) {
              await conn.query(
                "INSERT INTO materi_konten (materi_id, tipe_materi, pdf_file) VALUES (?, ?, ?)",
                [
                  materiId,
                  "pdf_file",
                  `/uploads-tyasacademy/${file.filename}`,
                ]
              );
            }
          }
        }

        await conn.commit();
        res.json({ id: materiId, slug: finalSlug });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.put(
  "/api/admin/materi/:id",
  authMiddleware(["admin"]),
  materiUpload,
  async (req, res) => {
    const { id } = req.params;
    const { judul_materi, slug, deskripsi, konten_materi } = req.body;
    if (!judul_materi) {
      return res.status(400).json({ message: "Missing fields" });
    }
    try {
      const finalSlug = slug || generateSlug(judul_materi);
      const bannerFile = req.files?.banner_image?.[0];
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        let bannerClause = "";
        const params = [judul_materi, finalSlug, deskripsi || null];
        if (bannerFile) {
          bannerClause = ", banner_image = ?";
          params.push(`/uploads-tyasacademy/${bannerFile.filename}`);
        }
        params.push(id);
        await conn.query(
          `UPDATE materi SET judul_materi = ?, slug = ?, deskripsi = ?${bannerClause} WHERE id = ?`,
          params
        );

        await conn.query("DELETE FROM materi_konten WHERE materi_id = ?", [id]);

        const kontenParsed = konten_materi ? JSON.parse(konten_materi) : [];
        for (const item of kontenParsed) {
          if (item.tipe_materi === "video_link") {
            await conn.query(
              "INSERT INTO materi_konten (materi_id, tipe_materi, video_link) VALUES (?, ?, ?)",
              [id, "video_link", item.video_link]
            );
          } else if (item.tipe_materi === "pdf_file" && item.client_key) {
            const file = (req.files?.pdf_files || []).find(
              (f) => f.originalname === item.client_key
            );
            if (file) {
              await conn.query(
                "INSERT INTO materi_konten (materi_id, tipe_materi, pdf_file) VALUES (?, ?, ?)",
                [id, "pdf_file", `/uploads-tyasacademy/${file.filename}`]
              );
            }
          }
        }

        await conn.commit();
        res.json({ message: "Updated" });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.delete(
  "/api/admin/materi/:id",
  authMiddleware(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM materi_konten WHERE materi_id = ?", [id]);
      await pool.query("DELETE FROM materi WHERE id = ?", [id]);
      res.json({ message: "Deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ---------- BIMBEL ----------

app.get("/api/admin/bimbel", authMiddleware(["admin"]), async (req, res) => {
  await listWithSearch(req, res, "bimbel", ["judul_bimbel", "slug"]);
});

app.post(
  "/api/admin/bimbel",
  authMiddleware(["admin"]),
  upload.single("cover_image"),
  async (req, res) => {
    const { judul_bimbel, slug, deskripsi, link_meeting, catatan_meeting } =
      req.body;
    if (!judul_bimbel || !link_meeting) {
      return res.status(400).json({ message: "Missing fields" });
    }
    try {
      const finalSlug = slug || generateSlug(judul_bimbel);
      const coverPath = req.file
        ? `/uploads-tyasacademy/${req.file.filename}`
        : null;
      const [result] = await pool.query(
        "INSERT INTO bimbel (judul_bimbel, slug, deskripsi, cover_image, link_meeting, catatan_meeting) VALUES (?, ?, ?, ?, ?, ?)",
        [
          judul_bimbel,
          finalSlug,
          deskripsi || null,
          coverPath,
          link_meeting,
          catatan_meeting || null,
        ]
      );
      res.json({ id: result.insertId, slug: finalSlug });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.put(
  "/api/admin/bimbel/:id",
  authMiddleware(["admin"]),
  upload.single("cover_image"),
  async (req, res) => {
    const { id } = req.params;
    const { judul_bimbel, slug, deskripsi, link_meeting, catatan_meeting } =
      req.body;
    if (!judul_bimbel || !link_meeting) {
      return res.status(400).json({ message: "Missing fields" });
    }
    try {
      const finalSlug = slug || generateSlug(judul_bimbel);
      let coverClause = "";
      const params = [
        judul_bimbel,
        finalSlug,
        deskripsi || null,
        link_meeting,
        catatan_meeting || null,
      ];
      if (req.file) {
        coverClause = ", cover_image = ?";
        params.push(`/uploads-tyasacademy/${req.file.filename}`);
      }
      params.push(id);
      await pool.query(
        `UPDATE bimbel SET judul_bimbel = ?, slug = ?, deskripsi = ?, link_meeting = ?, catatan_meeting = ?${coverClause} WHERE id = ?`,
        params
      );
      res.json({ message: "Updated" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.delete(
  "/api/admin/bimbel/:id",
  authMiddleware(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM bimbel WHERE id = ?", [id]);
      res.json({ message: "Deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ---------- PAKET ----------

app.get("/api/admin/paket", authMiddleware(["admin"]), async (req, res) => {
  await listWithSearch(req, res, "paket", ["nama_paket", "slug"]);
});

app.get("/api/admin/paket/:id", authMiddleware(["admin"]), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM paket WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    const paket = rows[0];
    const [bimbel] = await pool.query(
      "SELECT b.* FROM paket_bimbel pb JOIN bimbel b ON pb.bimbel_id = b.id WHERE pb.paket_id = ?",
      [id]
    );
    const [materi] = await pool.query(
      "SELECT m.* FROM paket_materi pm JOIN materi m ON pm.materi_id = m.id WHERE pm.paket_id = ?",
      [id]
    );
    const [tryout] = await pool.query(
      "SELECT t.* FROM paket_tryout pt JOIN tryout t ON pt.tryout_id = t.id WHERE pt.paket_id = ?",
      [id]
    );
    res.json({ ...paket, bimbel, materi, tryout });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post(
  "/api/admin/paket",
  authMiddleware(["admin"]),
  upload.single("cover_image"),
  async (req, res) => {
    const {
      nama_paket,
      slug,
      harga,
      durasi_aktif,
      fitur_paket,
      bimbel_ids,
      materi_ids,
      tryout_ids,
    } = req.body;
    if (!nama_paket || !harga) {
      return res.status(400).json({ message: "Missing fields" });
    }
    try {
      const finalSlug = slug || generateSlug(nama_paket);
      const coverPath = req.file
        ? `/uploads-tyasacademy/${req.file.filename}`
        : null;
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [result] = await conn.query(
          "INSERT INTO paket (nama_paket, slug, harga, durasi_aktif, cover_image, fitur_paket) VALUES (?, ?, ?, ?, ?, ?)",
          [
            nama_paket,
            finalSlug,
            harga,
            durasi_aktif || 0,
            coverPath,
            fitur_paket || null,
          ]
        );
        const paketId = result.insertId;
        if (bimbel_ids) {
          for (const id of JSON.parse(bimbel_ids)) {
            await conn.query(
              "INSERT INTO paket_bimbel (paket_id, bimbel_id) VALUES (?, ?)",
              [paketId, id]
            );
          }
        }
        if (materi_ids) {
          for (const id of JSON.parse(materi_ids)) {
            await conn.query(
              "INSERT INTO paket_materi (paket_id, materi_id) VALUES (?, ?)",
              [paketId, id]
            );
          }
        }
        if (tryout_ids) {
          for (const id of JSON.parse(tryout_ids)) {
            await conn.query(
              "INSERT INTO paket_tryout (paket_id, tryout_id) VALUES (?, ?)",
              [paketId, id]
            );
          }
        }
        await conn.commit();
        res.json({ id: paketId, slug: finalSlug });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.put(
  "/api/admin/paket/:id",
  authMiddleware(["admin"]),
  upload.single("cover_image"),
  async (req, res) => {
    const { id } = req.params;
    const {
      nama_paket,
      slug,
      harga,
      durasi_aktif,
      fitur_paket,
      bimbel_ids,
      materi_ids,
      tryout_ids,
    } = req.body;
    if (!nama_paket || !harga) {
      return res.status(400).json({ message: "Missing fields" });
    }
    try {
      const finalSlug = slug || generateSlug(nama_paket);
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        let coverClause = "";
        const params = [
          nama_paket,
          finalSlug,
          harga,
          durasi_aktif || 0,
          fitur_paket || null,
        ];
        if (req.file) {
          coverClause = ", cover_image = ?";
          params.push(`/uploads-tyasacademy/${req.file.filename}`);
        }
        params.push(id);
        await conn.query(
          `UPDATE paket SET nama_paket = ?, slug = ?, harga = ?, durasi_aktif = ?, fitur_paket = ?${coverClause} WHERE id = ?`,
          params
        );

        await conn.query("DELETE FROM paket_bimbel WHERE paket_id = ?", [id]);
        await conn.query("DELETE FROM paket_materi WHERE paket_id = ?", [id]);
        await conn.query("DELETE FROM paket_tryout WHERE paket_id = ?", [id]);

        if (bimbel_ids) {
          for (const bid of JSON.parse(bimbel_ids)) {
            await conn.query(
              "INSERT INTO paket_bimbel (paket_id, bimbel_id) VALUES (?, ?)",
              [id, bid]
            );
          }
        }
        if (materi_ids) {
          for (const mid of JSON.parse(materi_ids)) {
            await conn.query(
              "INSERT INTO paket_materi (paket_id, materi_id) VALUES (?, ?)",
              [id, mid]
            );
          }
        }
        if (tryout_ids) {
          for (const tid of JSON.parse(tryout_ids)) {
            await conn.query(
              "INSERT INTO paket_tryout (paket_id, tryout_id) VALUES (?, ?)",
              [id, tid]
            );
          }
        }

        await conn.commit();
        res.json({ message: "Updated" });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.delete(
  "/api/admin/paket/:id",
  authMiddleware(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM paket_bimbel WHERE paket_id = ?", [id]);
      await pool.query("DELETE FROM paket_materi WHERE paket_id = ?", [id]);
      await pool.query("DELETE FROM paket_tryout WHERE paket_id = ?", [id]);
      await pool.query("DELETE FROM paket WHERE id = ?", [id]);
      res.json({ message: "Deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ---------- TESTIMONI ----------

app.get(
  "/api/admin/testimoni",
  authMiddleware(["admin"]),
  async (req, res) => {
    await listWithSearch(req, res, "testimoni", ["nama", "testimoni"]);
  }
);

app.post(
  "/api/admin/testimoni",
  authMiddleware(["admin"]),
  upload.single("foto"),
  async (req, res) => {
    const { nama, testimoni, status_tampil } = req.body;
    if (!nama || !testimoni) {
      return res.status(400).json({ message: "Missing fields" });
    }
    try {
      const fotoPath = req.file
        ? `/uploads-tyasacademy/${req.file.filename}`
        : null;
      const [result] = await pool.query(
        "INSERT INTO testimoni (nama, foto, testimoni, status_tampil) VALUES (?, ?, ?, ?)",
        [nama, fotoPath, testimoni, status_tampil ? 1 : 0]
      );
      res.json({ id: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.put(
  "/api/admin/testimoni/:id",
  authMiddleware(["admin"]),
  upload.single("foto"),
  async (req, res) => {
    const { id } = req.params;
    const { nama, testimoni, status_tampil } = req.body;
    if (!nama || !testimoni) {
      return res.status(400).json({ message: "Missing fields" });
    }
    try {
      let fotoClause = "";
      const params = [nama, testimoni, status_tampil ? 1 : 0];
      if (req.file) {
        fotoClause = ", foto = ?";
        params.push(`/uploads-tyasacademy/${req.file.filename}`);
      }
      params.push(id);
      await pool.query(
        `UPDATE testimoni SET nama = ?, testimoni = ?, status_tampil = ?${fotoClause} WHERE id = ?`,
        params
      );
      res.json({ message: "Updated" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.delete(
  "/api/admin/testimoni/:id",
  authMiddleware(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM testimoni WHERE id = ?", [id]);
      res.json({ message: "Deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Public testimonials for landing page
app.get("/api/public/testimoni", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT nama, foto, testimoni FROM testimoni WHERE status_tampil = 1 ORDER BY id DESC LIMIT 10"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Public paket list for landing & marketing pages
app.get("/api/public/paket", async (req, res) => {
  await listWithSearch(req, res, "paket", ["nama_paket", "slug"]);
});

// ---------- KODE PROMO ----------

app.get(
  "/api/admin/kode-promo",
  authMiddleware(["admin"]),
  async (req, res) => {
    await listWithSearch(req, res, "kode_promo", ["kode_promo"]);
  }
);

app.post(
  "/api/admin/kode-promo",
  authMiddleware(["admin"]),
  async (req, res) => {
    const {
      kode_promo,
      tipe_diskon,
      nilai_diskon,
      expired_date,
      kuota,
      minimal_transaksi,
    } = req.body;
    if (!kode_promo || !tipe_diskon || !nilai_diskon || !expired_date) {
      return res.status(400).json({ message: "Missing fields" });
    }
    try {
      const [existing] = await pool.query(
        "SELECT id FROM kode_promo WHERE kode_promo = ?",
        [kode_promo]
      );
      if (existing.length) {
        return res.status(400).json({ message: "Kode promo sudah digunakan" });
      }
      const [result] = await pool.query(
        "INSERT INTO kode_promo (kode_promo, tipe_diskon, nilai_diskon, expired_date, kuota, minimal_transaksi) VALUES (?, ?, ?, ?, ?, ?)",
        [
          kode_promo,
          tipe_diskon,
          nilai_diskon,
          expired_date,
          kuota || 0,
          minimal_transaksi || 0,
        ]
      );
      res.json({ id: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.put(
  "/api/admin/kode-promo/:id",
  authMiddleware(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    const {
      tipe_diskon,
      nilai_diskon,
      expired_date,
      kuota,
      minimal_transaksi,
    } = req.body;
    if (!tipe_diskon || !nilai_diskon || !expired_date) {
      return res.status(400).json({ message: "Missing fields" });
    }
    try {
      await pool.query(
        "UPDATE kode_promo SET tipe_diskon = ?, nilai_diskon = ?, expired_date = ?, kuota = ?, minimal_transaksi = ? WHERE id = ?",
        [tipe_diskon, nilai_diskon, expired_date, kuota || 0, minimal_transaksi || 0, id]
      );
      res.json({ message: "Updated" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.delete(
  "/api/admin/kode-promo/:id",
  authMiddleware(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM kode_promo WHERE id = ?", [id]);
      res.json({ message: "Deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ---------- TRANSAKSI & CHECKOUT ----------

app.get(
  "/api/admin/transaksi",
  authMiddleware(["admin"]),
  async (req, res) => {
    const { limit, offset } = buildPagination(req);
    const search = req.query.search || "";
    try {
      const like = `%${search}%`;
      const [rows] = await pool.query(
        `SELECT tr.*, u.name as user_name, p.nama_paket
         FROM transaksi tr
         JOIN users u ON tr.user_id = u.id
         JOIN paket p ON tr.paket_id = p.id
         WHERE u.name LIKE ? OR p.nama_paket LIKE ?
         ORDER BY tr.id DESC
         LIMIT ? OFFSET ?`,
        [like, like, limit, offset]
      );
      const [countRows] = await pool.query(
        `SELECT COUNT(*) as total
         FROM transaksi tr
         JOIN users u ON tr.user_id = u.id
         JOIN paket p ON tr.paket_id = p.id
         WHERE u.name LIKE ? OR p.nama_paket LIKE ?`,
        [like, like]
      );
      res.json({
        data: rows,
        total: countRows[0].total,
        page: parseInt(req.query.page || "1", 10),
        limit,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.patch(
  "/api/admin/transaksi/:id/status",
  authMiddleware(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["pending", "success", "failed", "expired"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Status tidak valid" });
    }
    try {
      const [result] = await pool.query(
        "UPDATE transaksi SET status = ? WHERE id = ?",
        [status, id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Transaksi tidak ditemukan" });
      }
      res.json({ id, status });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Validate promo code for checkout
app.post(
  "/api/user/validate-promo",
  authMiddleware(["user", "admin"]),
  async (req, res) => {
    const { kode_promo, total } = req.body;
    if (!kode_promo || !total) {
      return res.status(400).json({ message: "Missing fields" });
    }
    try {
      const [rows] = await pool.query(
        "SELECT * FROM kode_promo WHERE kode_promo = ?",
        [kode_promo]
      );
      if (!rows.length) {
        return res.status(404).json({ message: "Kode promo tidak ditemukan" });
      }
      const promo = rows[0];
      const now = new Date();
      const expired = new Date(promo.expired_date);
      if (expired < now) {
        return res.status(400).json({ message: "Kode promo sudah expired" });
      }
      if (promo.kuota !== null && promo.kuota <= 0) {
        return res.status(400).json({ message: "Kuota promo habis" });
      }
      if (promo.minimal_transaksi && total < promo.minimal_transaksi) {
        return res
          .status(400)
          .json({ message: "Total belum memenuhi minimal transaksi" });
      }
      let potongan = 0;
      if (promo.tipe_diskon === "percent") {
        potongan = (promo.nilai_diskon / 100) * total;
      } else {
        potongan = promo.nilai_diskon;
      }
      const finalTotal = Math.max(total - potongan, 0);
      res.json({
        promo,
        potongan,
        finalTotal,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// User checkout paket
app.post(
  "/api/user/checkout",
  authMiddleware(["user", "admin"]),
  async (req, res) => {
    const { paket_id, kode_promo } = req.body;
    if (!paket_id) {
      return res.status(400).json({ message: "Missing paket_id" });
    }
    try {
      const [paketRows] = await pool.query(
        "SELECT * FROM paket WHERE id = ?",
        [paket_id]
      );
      if (!paketRows.length) {
        return res.status(404).json({ message: "Paket tidak ditemukan" });
      }
      const paket = paketRows[0];
      let total = paket.harga;
      let appliedPromo = null;
      if (kode_promo) {
        const [promoRows] = await pool.query(
          "SELECT * FROM kode_promo WHERE kode_promo = ?",
          [kode_promo]
        );
        if (promoRows.length) {
          const promo = promoRows[0];
          const now = new Date();
          const expired = new Date(promo.expired_date);
          if (
            expired >= now &&
            (!promo.minimal_transaksi || total >= promo.minimal_transaksi) &&
            (promo.kuota === null || promo.kuota > 0)
          ) {
            let potongan = 0;
            if (promo.tipe_diskon === "percent") {
              potongan = (promo.nilai_diskon / 100) * total;
            } else {
              potongan = promo.nilai_diskon;
            }
            total = Math.max(total - potongan, 0);
            appliedPromo = promo;
          }
        }
      }
      const [result] = await pool.query(
        "INSERT INTO transaksi (user_id, paket_id, harga, status, tanggal, kode_promo_id) VALUES (?, ?, ?, ?, NOW(), ?)",
        [
          req.user.id,
          paket.id,
          total,
          "pending",
          appliedPromo ? appliedPromo.id : null,
        ]
      );

      const transaksiId = result.insertId;

      // Create Midtrans Snap transaction
      const orderId = `TA-${transaksiId}`;
      const snapPayload = {
        transaction_details: {
          order_id: orderId,
          gross_amount: total,
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          first_name: req.user.name || "User",
          email: req.user.email,
        },
        item_details: [
          {
            id: String(paket.id),
            price: total,
            quantity: 1,
            name: paket.nama_paket,
          },
        ],
        callbacks: {
          finish: `${process.env.APP_BASE_URL || "http://localhost:5173"}/payment/finish`,
        },
      };

      const authHeader = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString(
        "base64"
      );

      const snapRes = await fetch(
        `${MIDTRANS_SNAP_BASE_URL}/transactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${authHeader}`,
          },
          body: JSON.stringify(snapPayload),
        }
      );

      if (!snapRes.ok) {
        console.error("Midtrans error status:", snapRes.status);
        const text = await snapRes.text();
        console.error("Midtrans error body:", text);
        return res.status(500).json({
          message: "Gagal membuat transaksi Midtrans",
        });
      }

      const snapData = await snapRes.json();

      if (appliedPromo && appliedPromo.kuota !== null) {
        await pool.query(
          "UPDATE kode_promo SET kuota = kuota - 1 WHERE id = ?",
          [appliedPromo.id]
        );
      }
      res.json({
        transaksi_id: transaksiId,
        total,
        status: "pending",
        midtrans: {
          order_id: orderId,
          token: snapData.token,
          redirect_url: snapData.redirect_url,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// User transaksi history
app.get(
  "/api/user/transaksi",
  authMiddleware(["user", "admin"]),
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT tr.*, p.nama_paket 
         FROM transaksi tr
         JOIN paket p ON tr.paket_id = p.id
         WHERE tr.user_id = ?
         ORDER BY tr.id DESC`,
        [req.user.id]
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ---------- MIDTRANS NOTIFICATIONS ----------

const verifyMidtransSignature = (body) => {
  const { order_id, status_code, gross_amount, signature_key } = body;
  if (!order_id || !status_code || !gross_amount || !signature_key) {
    return false;
  }
  const payload = `${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`;
  const expectedSignature = CryptoJS.SHA512(payload).toString(CryptoJS.enc.Hex);
  return expectedSignature === signature_key;
};

const handleMidtransStatusUpdate = async (body) => {
  const { order_id, transaction_status } = body;
  if (!order_id || !transaction_status) return;

  const transaksiId = parseInt(String(order_id).replace("TA-", ""), 10);
  if (!transaksiId) return;

  let newStatus = "pending";
  if (
    transaction_status === "capture" ||
    transaction_status === "settlement"
  ) {
    newStatus = "success";
  } else if (
    transaction_status === "cancel" ||
    transaction_status === "expire"
  ) {
    newStatus = "expired";
  } else if (transaction_status === "deny") {
    newStatus = "failed";
  }

  await pool.query("UPDATE transaksi SET status = ? WHERE id = ?", [
    newStatus,
    transaksiId,
  ]);
};

// General payment notification
app.post("/api/midtrans/notification", async (req, res) => {
  try {
    if (!verifyMidtransSignature(req.body)) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    await handleMidtransStatusUpdate(req.body);
    res.json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Recurring payment notification
app.post("/api/midtrans/notification/recurring", async (req, res) => {
  try {
    if (!verifyMidtransSignature(req.body)) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    await handleMidtransStatusUpdate(req.body);
    res.json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- USER DASHBOARD DATA ----------

// Public list paket for user
app.get("/api/user/paket", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nama_paket, slug, harga, durasi_aktif, cover_image, fitur_paket FROM paket ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// User accessible bimbel/materi/tryout from purchased paket
app.get(
  "/api/user/resources",
  authMiddleware(["user", "admin"]),
  async (req, res) => {
    try {
      const [paketRows] = await pool.query(
        `SELECT DISTINCT p.id 
         FROM transaksi t
         JOIN paket p ON t.paket_id = p.id
         WHERE t.user_id = ? AND t.status = 'success'`,
        [req.user.id]
      );
      const paketIds = paketRows.map((p) => p.id);
      if (!paketIds.length) {
        return res.json({ bimbel: [], materi: [], tryout: [] });
      }
      const inClause = paketIds.map(() => "?").join(",");
      const [bimbel] = await pool.query(
        `SELECT DISTINCT b.* 
         FROM paket_bimbel pb
         JOIN bimbel b ON pb.bimbel_id = b.id
         WHERE pb.paket_id IN (${inClause})`,
        paketIds
      );
      const [materi] = await pool.query(
        `SELECT DISTINCT m.* 
         FROM paket_materi pm
         JOIN materi m ON pm.materi_id = m.id
         WHERE pm.paket_id IN (${inClause})`,
        paketIds
      );
      const [tryout] = await pool.query(
        `SELECT DISTINCT t.* 
         FROM paket_tryout pt
         JOIN tryout t ON pt.tryout_id = t.id
         WHERE pt.paket_id IN (${inClause})`,
        paketIds
      );
      res.json({ bimbel, materi, tryout });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Detail materi untuk user (hanya jika berasal dari paket yang dibeli)
app.get(
  "/api/user/materi/:id",
  authMiddleware(["user", "admin"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      const [rows] = await pool.query(
        `SELECT m.* 
         FROM transaksi t
         JOIN paket p ON t.paket_id = p.id
         JOIN paket_materi pm ON p.id = pm.paket_id
         JOIN materi m ON pm.materi_id = m.id
         WHERE t.user_id = ? AND t.status = 'success' AND m.id = ?
         LIMIT 1`,
        [req.user.id, id]
      );
      if (!rows.length) {
        return res.status(404).json({ message: "Materi tidak ditemukan" });
      }
      const materi = rows[0];
      const [konten] = await pool.query(
        "SELECT * FROM materi_konten WHERE materi_id = ? ORDER BY id ASC",
        [id]
      );
      res.json({ ...materi, konten });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Detail tryout untuk user (soal + opsi, tanpa kunci)
app.get(
  "/api/user/tryout/:id",
  authMiddleware(["user", "admin"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      const [rows] = await pool.query(
        `SELECT t.* 
         FROM transaksi tr
         JOIN paket p ON tr.paket_id = p.id
         JOIN paket_tryout pt ON p.id = pt.paket_id
         JOIN tryout t ON pt.tryout_id = t.id
         WHERE tr.user_id = ? AND tr.status = 'success' AND t.id = ?
         LIMIT 1`,
        [req.user.id, id]
      );
      if (!rows.length) {
        return res.status(404).json({ message: "Tryout tidak ditemukan" });
      }
      const tryout = rows[0];
      const [[pgRow]] =
        await pool.query(
          `SELECT s.passing_grade
           FROM tryout_soal ts
           JOIN bank_soal b ON ts.bank_soal_id = b.id
           JOIN tipe_soal s ON b.tipe_soal_id = s.id
           WHERE ts.tryout_id = ?
           LIMIT 1`,
          [id]
        );
      const passingGrade = pgRow?.passing_grade ?? null;
      const [soalRows] = await pool.query(
        `SELECT b.id as bank_soal_id, b.soal
         FROM tryout_soal ts
         JOIN bank_soal b ON ts.bank_soal_id = b.id
         WHERE ts.tryout_id = ?
         ORDER BY ts.id ASC`,
        [id]
      );
      const bankIds = soalRows.map((s) => s.bank_soal_id);
      let opsi = [];
      if (bankIds.length) {
        const inClause = bankIds.map(() => "?").join(",");
        const [opsiRows] = await pool.query(
          `SELECT bank_soal_id, label, konten 
           FROM opsi_jawaban 
           WHERE bank_soal_id IN (${inClause})
           ORDER BY bank_soal_id, label ASC`,
          bankIds
        );
        opsi = opsiRows;
      }
      const soal = soalRows.map((s) => ({
        bank_soal_id: s.bank_soal_id,
        soal: s.soal,
        opsi: opsi
          .filter((o) => o.bank_soal_id === s.bank_soal_id)
          .map((o) => ({
            label: o.label,
            konten: o.konten,
          })),
      }));
      res.json({ ...tryout, soal, passingGrade });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Dashboard tryout: total peserta, riwayat saya, leaderboard
app.get(
  "/api/user/tryout/:id/dashboard",
  authMiddleware(["user", "admin"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      const [rows] = await pool.query(
        `SELECT t.* 
         FROM transaksi tr
         JOIN paket p ON tr.paket_id = p.id
         JOIN paket_tryout pt ON p.id = pt.paket_id
         JOIN tryout t ON pt.tryout_id = t.id
         WHERE tr.user_id = ? AND tr.status = 'success' AND t.id = ?
         LIMIT 1`,
        [req.user.id, id]
      );
      if (!rows.length) {
        return res.status(404).json({ message: "Tryout tidak ditemukan" });
      }
      const tryout = rows[0];

      const [[{ total_peserta }]] = await pool.query(
        `SELECT COUNT(DISTINCT user_id) as total_peserta FROM tryout_hasil WHERE tryout_id = ?`,
        [id]
      );

      const [attempts] = await pool.query(
        `SELECT id, total_score, max_score, percentage, lulus, created_at
         FROM tryout_hasil
         WHERE tryout_id = ? AND user_id = ?
         ORDER BY created_at DESC`,
        [id, req.user.id]
      );

      const [allAttempts] = await pool.query(
        `SELECT h.user_id, u.name, h.total_score, h.max_score, h.percentage
         FROM tryout_hasil h
         JOIN users u ON u.id = h.user_id
         WHERE h.tryout_id = ?
         ORDER BY h.percentage DESC, h.id DESC`,
        [id]
      );
      const byUser = new Map();
      for (const row of allAttempts) {
        if (!byUser.has(row.user_id)) byUser.set(row.user_id, row);
      }
      const leaderboard = [...byUser.values()].sort(
        (a, b) => Number(b.percentage) - Number(a.percentage)
      );

      res.json({
        tryout,
        total_peserta: total_peserta ?? 0,
        attempts,
        leaderboard,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Satu hasil tryout (untuk statistik & pembahasan)
app.get(
  "/api/user/tryout/:id/hasil/:hasilId",
  authMiddleware(["user", "admin"]),
  async (req, res) => {
    const { id, hasilId } = req.params;
    try {
      const [rows] = await pool.query(
        `SELECT h.id, h.user_id, h.tryout_id, h.total_score, h.max_score, h.percentage, h.lulus, h.details, h.created_at
         FROM tryout_hasil h
         WHERE h.id = ? AND h.tryout_id = ? AND h.user_id = ?`,
        [hasilId, id, req.user.id]
      );
      if (!rows.length) {
        return res.status(404).json({ message: "Hasil tidak ditemukan" });
      }
      const row = rows[0];
      const details = row.details ? JSON.parse(row.details) : [];
      res.json({
        id: row.id,
        total_score: row.total_score,
        max_score: row.max_score,
        percentage: row.percentage,
        lulus: !!row.lulus,
        details,
        created_at: row.created_at,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Simplified tryout attempt endpoint with passing grade logic
app.post(
  "/api/user/tryout/:id/submit",
  authMiddleware(["user", "admin"]),
  async (req, res) => {
    const { id } = req.params;
    const { answers } = req.body; // { [bank_soal_id]: selected_label }
    if (!answers) {
      return res.status(400).json({ message: "Missing answers" });
    }
    try {
      const [tryoutRows] = await pool.query(
        `SELECT t.*, s.passing_grade
         FROM tryout t
         JOIN tryout_soal ts ON t.id = ts.tryout_id
         JOIN bank_soal b ON ts.bank_soal_id = b.id
         JOIN tipe_soal s ON b.tipe_soal_id = s.id
         WHERE t.id = ?
         LIMIT 1`,
        [id]
      );
      if (!tryoutRows.length) {
        return res.status(404).json({ message: "Tryout not found" });
      }
      const passingGrade = tryoutRows[0].passing_grade;
      const [soalRows] = await pool.query(
        `SELECT b.id as bank_soal_id, b.soal, b.pembahasan,
                o.label, o.konten, o.skor, o.benar
         FROM tryout_soal ts
         JOIN bank_soal b ON ts.bank_soal_id = b.id
         JOIN opsi_jawaban o ON b.id = o.bank_soal_id
         WHERE ts.tryout_id = ?`,
        [id]
      );
      let totalScore = 0;
      let maxScore = 0;
      const perQuestion = new Map();
      for (const row of soalRows) {
        maxScore += row.skor;
        const userAnswer = answers[row.bank_soal_id];
        if (userAnswer && userAnswer === row.label && row.benar) {
          totalScore += row.skor;
        }
        if (!perQuestion.has(row.bank_soal_id)) {
          perQuestion.set(row.bank_soal_id, {
            bank_soal_id: row.bank_soal_id,
            soal: row.soal,
            pembahasan: row.pembahasan,
            opsi: [],
          });
        }
        const q = perQuestion.get(row.bank_soal_id);
        q.opsi.push({
          label: row.label,
          konten: row.konten,
          skor: row.skor,
          benar: !!row.benar,
        });
      }
      const percentage = maxScore ? (totalScore / maxScore) * 100 : 0;
      const lulus = totalScore >= passingGrade;
      const details = Array.from(perQuestion.values()).map((q) => {
        const correct = q.opsi.find((o) => o.benar);
        return {
          bank_soal_id: q.bank_soal_id,
          soal: q.soal,
          pembahasan: q.pembahasan,
          opsi: q.opsi.map((o) => ({
            label: o.label,
            konten: o.konten,
          })),
          jawaban_user: answers[q.bank_soal_id] || null,
          jawaban_benar: correct ? correct.label : null,
        };
      });
      await pool.query(
        `INSERT INTO tryout_hasil (user_id, tryout_id, total_score, max_score, percentage, lulus, details)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          id,
          totalScore,
          maxScore,
          percentage,
          lulus ? 1 : 0,
          JSON.stringify(details),
        ]
      );
      res.json({
        totalScore,
        maxScore,
        percentage,
        passingGrade,
        lulus,
        details,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ---------- LANDING PAGE BASIC DATA ----------

app.get("/api/public/overview", async (req, res) => {
  try {
    const [[users]] = await pool.query(
      "SELECT COUNT(*) as total_users FROM users WHERE role = 'user'"
    );
    const [[paket]] = await pool.query(
      "SELECT COUNT(*) as total_paket FROM paket"
    );
    const [[transaksi]] = await pool.query(
      "SELECT COUNT(*) as total_transaksi FROM transaksi"
    );
    const [[tryout]] = await pool.query(
      "SELECT COUNT(*) as total_tryout FROM tryout"
    );
    res.json({
      total_users: users.total_users,
      total_paket: paket.total_paket,
      total_transaksi: transaksi.total_transaksi,
      total_tryout: tryout.total_tryout,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("CardioDemy API running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

