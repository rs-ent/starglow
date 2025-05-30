'use client'

import {useReportWebVitals} from 'next/web-vitals'

export function WebVitals() {
    useReportWebVitals((metric) => {
        console.log(metric)

        // 개발 환경에서만 콘솔에 출력
        if (process.env.NODE_ENV === 'development') {
            console.log(metric)
        }

        // 프로덕션 환경에서는 분석 서비스로 전송
        if (process.env.NODE_ENV === 'production') {
            // 예: 커스텀 엔드포인트로 전송
            const body = JSON.stringify(metric)
            const url = '/api/metrics'

            // `navigator.sendBeacon()`이 지원되면 사용, 아니면 fetch
            if (navigator.sendBeacon) {
                navigator.sendBeacon(url, body)
            } else {
                fetch(url, { body, method: 'POST', keepalive: true })
            }
        }
    })

    return null
}