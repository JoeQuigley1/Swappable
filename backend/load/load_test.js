import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 50,          // 50 concurrent users
    duration: '30s',  // Duration of test
};

export default function () {
    // This points to the correct docker-compose service name and the items DB endpoint
const res = http.get('http://localhost:8080/api/swap-requests');    check(res, {
        'status is 200': (r) => r.status === 200,
    });

    sleep(1);
}