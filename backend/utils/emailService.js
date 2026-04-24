const sendEmail = async ({ to, subject, text, html }) => {
  console.log('=== MOCK EMAIL SERVICE ===');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${text || html}`);
  console.log('=========================');
  return { success: true, message: 'Email logged to console (mock mode)' };
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
  return sendEmail({
    to: email,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Use this link to reset your password: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email.`
  });
};

const sendVerificationEmail = async (email, verificationToken) => {
  const verifyUrl = `http://localhost:3000/verify-email?token=${verificationToken}`;
  return sendEmail({
    to: email,
    subject: 'Verify Your Email',
    text: `Please verify your email by clicking this link: ${verifyUrl}`
  });
};

module.exports = { sendEmail, sendPasswordResetEmail, sendVerificationEmail };
