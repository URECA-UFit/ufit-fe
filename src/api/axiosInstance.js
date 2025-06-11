import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

let isRefreshing = false
let refreshSubscribers = []

function onRefreshed(token) {
  console.log('[토큰 재발급] 모든 구독 요청에 새 토큰 전파')
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(callback) {
  console.log('[토큰 재발급] 구독 요청 추가')
  refreshSubscribers.push(callback)
}
api.interceptors.response.use(
  res => res,
  async error => {
    const { config, response } = error;

    if (!response) {
      console.warn('[에러] 네트워크 또는 서버 응답 없음');
      return Promise.reject(error);
    }

    const { status, data } = response;

    const isTokenExpired = status === 401 && data?.message === 'Expired token';

    if (isTokenExpired && !config._retry) {
      config._retry = true;

      if (!isRefreshing) {
        console.warn('[토큰 만료] 토큰 재발급 시도 시작');
        isRefreshing = true;
        try {
          const expiredAccessToken = localStorage.getItem('accessToken');
          
          const res = await axios.post(
            '/api/auth/reissue/token', 
            {}, 
            { 
              withCredentials: true,
              headers: {
                // 'Authorization' 헤더에 'Bearer ' 접두사와 함께 가져온 토큰 값을 사용합니다.
                'Authorization': expiredAccessToken ? `Bearer ${expiredAccessToken}` : '', 
              }
            }
          );

          const newAccessToken = res.headers['authorization']?.replace('Bearer ', '');
          console.warn(newAccessToken);
          
          if (newAccessToken) {
            console.info('[토큰 재발급 성공] 새로운 토큰:', newAccessToken);
            localStorage.setItem('accessToken', newAccessToken);
            onRefreshed(newAccessToken);
          } else {
            console.error('[토큰 재발급 실패] 응답에 토큰 없음');
          }

          isRefreshing = false;
        } catch (e) {
          console.error('[토큰 재발급 실패]', e);
          isRefreshing = false;
          //window.location.href = '/login';
          return Promise.reject(e);
        }
      } else {
        console.log('[토큰 재발급 중] 구독자로 요청 대기');
      }

      return new Promise((resolve) => {
        addRefreshSubscriber((newToken) => {
          console.log('[요청 재시도] 새로운 토큰으로 요청 재시도');
          config.headers['Authorization'] = `Bearer ${newToken}`;
          resolve(api(config));
        });
      });
    }

    console.error('[API 에러]', status, data);
    return Promise.reject(error);
  }
);

export default api;
