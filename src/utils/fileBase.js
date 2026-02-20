const getFileBase = () => {
  const apiBase = import.meta.env.VITE_API_URL || "https://api-inventory.isavralabel.com/tyasacademy/api";
  return apiBase.replace(/\/api\/?$/, "");
};

export default getFileBase;

