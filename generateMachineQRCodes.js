const qrcode = require('qrcode');

const baseURL = 'http://localhost:5000/api/users/start'; // Update if deployed

async function generateQRCodesForMachines(total = 10) {
    for (let i = 1; i <= total; i++) {
        const url = `${baseURL}/${i}`;
        const qr = await qrcode.toDataURL(url);
        console.log(`Machine ${i}:\n${qr}\n`);
    }
}

generateQRCodesForMachines();
