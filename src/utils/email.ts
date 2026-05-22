import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const sendOrderNotification = async (params: {
  orderNumber: string
  consumerName: string
  totalPrice: number
  farmerEmail: string
}): Promise<void> => {
  const subject = `[마을장터] 새 주문이 도착했습니다 — ${params.orderNumber}`
  const text = `
주문번호: ${params.orderNumber}
주문자: ${params.consumerName}
총 금액: ${params.totalPrice.toLocaleString()}원

관리자 페이지에서 주문을 확인해 주세요.
  `.trim()

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: [params.farmerEmail, process.env.ADMIN_EMAIL || ''],
    subject,
    text,
  })
}
