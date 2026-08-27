const crypto = require('crypto');
const qs = require('qs');

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    sorted[key] = obj[key];
  }

  return sorted;
}

function createPaymentUrl({
  tmnCode,
  secretKey,
  vnpUrl,
  returnUrl,
  txnRef,
  orderInfo,
  amount,
  ipAddr,
  bankCode = '',
  locale = 'vn',
  orderType = 'other'
}) {
  const createDate = new Date();
  const yyyy = createDate.getFullYear();
  const MM = String(createDate.getMonth() + 1).padStart(2, '0');
  const dd = String(createDate.getDate()).padStart(2, '0');
  const HH = String(createDate.getHours()).padStart(2, '0');
  const mm = String(createDate.getMinutes()).padStart(2, '0');
  const ss = String(createDate.getSeconds()).padStart(2, '0');

  const vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: orderType,
    vnp_Amount: Math.round(Number(amount) * 100),
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr || '127.0.0.1',
    vnp_CreateDate: `${yyyy}${MM}${dd}${HH}${mm}${ss}`
  };

  if (bankCode) {
    vnp_Params.vnp_BankCode = bankCode;
  }

  const sortedParams = sortObject(vnp_Params);
  const signData = qs.stringify(sortedParams, { encode: false });

  const secureHash = crypto
    .createHmac('sha512', secretKey)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  sortedParams.vnp_SecureHash = secureHash;

  return `${vnpUrl}?${qs.stringify(sortedParams, { encode: true })}`;
}

function verifyReturn(query, secretKey) {
  const vnp_Params = { ...query };
  const secureHash = vnp_Params.vnp_SecureHash;

  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  const sortedParams = sortObject(vnp_Params);
  const signData = qs.stringify(sortedParams, { encode: false });

  const signed = crypto
    .createHmac('sha512', secretKey)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  return secureHash === signed;
}

module.exports = {
  createPaymentUrl,
  verifyReturn
};