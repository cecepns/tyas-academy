const getFileBase = () => {
  const apiBase = import.meta.env.VITE_API_URL || "https://api.kingcreativestudio.my.id/tyasacademy/api";
  return apiBase.replace(/\/api\/?$/, "");
};

export default getFileBase;

