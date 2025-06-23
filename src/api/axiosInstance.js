import axios from 'axios'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  withCredentials: true,
})

let isRefreshing = false
let refreshSubscribers = []

function onRefreshed(token) {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback)
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  async error => {
    const { config, response } = error;

    if (!response) {
      return Promise.reject(error);
    }

    const { status, data } = response;

    const isTokenExpired = status === 401 && data?.message === 'Expired token';

    if (isTokenExpired && !config._retry) {
      config._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const expiredAccessToken = localStorage.getItem('accessToken');
          
          const res = await axios.post(
            '/api/auth/reissue/token', 
            {}, 
            { 
              withCredentials: true,
              headers: {
                'Authorization': expiredAccessToken ? `Bearer ${expiredAccessToken}` : '', 
              }
            }
          );

          const newAccessToken = res.headers['authorization']?.replace('Bearer ', '');
          
          if (newAccessToken) {
            localStorage.setItem('accessToken', newAccessToken);
            onRefreshed(newAccessToken);
          }

          isRefreshing = false;
        } catch (e) {
          isRefreshing = false;
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
          return Promise.reject(e);
        }
      }

      return new Promise((resolve) => {
        addRefreshSubscriber((newToken) => {
          config.headers['Authorization'] = `Bearer ${newToken}`;
          resolve(api(config));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
