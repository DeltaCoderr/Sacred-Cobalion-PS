exports.colourize = function (text, name, useOriginal) {
    let ccjs = JSON.parse(String(fs.readFileSync('./data/customcolors.json')));
    
    if (!name) name = toId(text);
   if (Object.keys(ccjs).includes(toId(name)) && !useOriginal) name = ccjs[name];
    let md5 = require('js-md5');
    let hash = md5(toId(name));
    let H = parseInt(hash.substr(4, 4), 16) % 360;
    let S = parseInt(hash.substr(0, 4), 16) % 50 + 40;
    let L = Math.floor(parseInt(hash.substr(8, 4), 16) % 20 + 30);
    let C = (100 - Math.abs(2 * L - 100)) * S / 100 / 100;
    let X = C * (1 - Math.abs((H / 60) % 2 - 1));
    let m = L / 100 - C / 2;
    let R1;
    let G1;
    let B1;
    switch (Math.floor(H / 60)) {
    case 1: R1 = X; G1 = C; B1 = 0; break;
    case 2: R1 = 0; G1 = C; B1 = X; break;
    case 3: R1 = 0; G1 = X; B1 = C; break;
    case 4: R1 = X; G1 = 0; B1 = C; break;
    case 5: R1 = C; G1 = 0; B1 = X; break;
    case 0: default: R1 = C; G1 = X; B1 = 0; break;
    }
    let R = R1 + m;
    let G = G1 + m;
    let B = B1 + m;
    let lum = R * R * R * 0.2126 + G * G * G * 0.7152 + B * B * B * 0.0722;
    let HLmod = (lum - 0.2) * -150;
    if (HLmod > 18) HLmod = (HLmod - 18) * 2.5;
    else if (HLmod < 0) HLmod = (HLmod - 0) / 3;
    else HLmod = 0;
    let Hdist = Math.min(Math.abs(180 - H), Math.abs(240 - H));
    if (Hdist < 15) {
        HLmod += (15 - Hdist) / 3;
    }
    L += HLmod;
    return '<STRONG style=\"' + `color:hsl(${H},${S}%,${L}%);` + '\">' + text + '</STRONG>';
}