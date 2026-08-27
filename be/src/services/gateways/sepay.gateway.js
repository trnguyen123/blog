function getSepayConfig() {
  return {
    qrBaseUrl: process.env.SEPAY_QR_BASE_URL || 'https://qr.sepay.vn/img',
    bank: process.env.SEPAY_BANK || 'MBBank',
    bankCode: process.env.SEPAY_BANK_CODE || '970422',
    accountNumber: process.env.SEPAY_ACCOUNT_NUMBER,
    accountName: process.env.SEPAY_ACCOUNT_NAME || ''
  };
}

function generateTransferContent({ transactionId, subscriptionId, userId }) {
  return `${transactionId} SUB_${subscriptionId} USER_${userId}`;
}

function createQrUrl({ amount, content }) {
  const config = getSepayConfig();

  if (!config.accountNumber) {
    throw new Error('SEPAY_ACCOUNT_NUMBER_REQUIRED');
  }

  const params = new URLSearchParams({
    acc: config.accountNumber,
    bank: config.bank,
    amount: String(amount),
    des: content
  });

  return `${config.qrBaseUrl}?${params.toString()}`;
}

function createPaymentQr({ amount, transactionId, subscriptionId, userId }) {
  const config = getSepayConfig();

  const transferContent = generateTransferContent({
    transactionId,
    subscriptionId,
    userId
  });

  const qrUrl = createQrUrl({
    amount,
    content: transferContent
  });

  return {
    payment_url: qrUrl,
    qr_url: qrUrl,
    transfer_content: transferContent,
    bank_info: {
      bank_name: config.bank,
      bank_code: config.bankCode,
      account_number: config.accountNumber,
      account_name: config.accountName,
      amount: amount,
      content: transferContent
    }
  };
}

module.exports = {
  createPaymentQr
};