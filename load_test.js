import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,          // 50 concurrent virtual users
  duration: '30s',  // Duration of the test
};

export default function () {
  // Replace '/api/health' or your actual endpoint
  const res = http.get('http://backend:8080/api/health');

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}