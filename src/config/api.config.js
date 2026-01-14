import axios from "axios";

const baseURL=process.env.CLIENT_URL||"http://localhost:3000/api";
const instance=axios.create({
    baseURL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json"
    }
});

instance.interceptors.request.use((config) =>
{
    const token=localStorage.getItem("token");
    if (token)
    {
        config.headers=config.headers||{};
        config.headers["Authorization"]=`Bearer ${token}`;
    }
    return config;
});

export default instance;
