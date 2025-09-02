const mod = (n, m) => ((n % m) + m) % m;
const EAM = {};
const EAM_rev = {};
for (let i = 0; i < 95; i++) {
  EAM[String.fromCharCode(i + 32)] = i;
  EAM_rev[i] = String.fromCharCode(i + 32);
}

function textToMatrix(text, size = 2) {
  let padded = text;
  if (padded.length % size !== 0) {
    padded += ' ';
  }
  const nums = Array.from(padded).map(c => {
    if (!(c in EAM)) throw new Error(`Invalid character: ${c}`);
    return EAM[c];
  });


  const blocks = [];
  for (let i = 0; i < nums.length; i += size) {
    blocks.push(nums.slice(i, i + size));
  }


  return { blocks, padded };
}



function multiplyBlock(block, matrix) {
  const result = [];
  for (let i = 0; i < matrix.length; i++) {
    let sum = 0;
    for (let j = 0; j < block.length; j++) {
      sum += block[j] * matrix[j][i];
    }
    result.push(mod(sum, 95));
  }
  return result;
}



function encryptHill(plaintext, key) {
  if (key.length !== 4) throw new Error("Key must be 4 characters long");


  const keyNums = Array.from(key).map(c => EAM[c]);
  const keyMatrix = [
    [keyNums[0], keyNums[1]],
    [keyNums[2], keyNums[3]]
  ];


  const { blocks } = textToMatrix(plaintext);


  const encryptedNums = blocks.flatMap(block => multiplyBlock(block, keyMatrix));
  return encryptedNums.map(n => EAM_rev[n]).join('');
}



function modInv(a, m) {
  a = mod(a, m);
  for (let x = 1; x < m; x++) {
    if (mod(a * x, m) === 1) return x;
  }
  throw new Error("No modular inverse for determinant");
}



function invertMatrix(matrix) {
  const [[a, b], [c, d]] = matrix;
  const det = mod(a * d - b * c, 95);
  const detInv = modInv(det, 95);


  const adjugate = [
    [d, -b],
    [-c, a]
  ];


  return adjugate.map(row => row.map(val => mod(val * detInv, 95)));
}



function decryptHill(ciphertext, key) {
  if (key.length !== 4) throw new Error("Key must be 4 characters long");


  const keyNums = Array.from(key).map(c => EAM[c]);
  const keyMatrix = [
    [keyNums[0], keyNums[1]],
    [keyNums[2], keyNums[3]]
  ];


  const invMatrix = invertMatrix(keyMatrix);


  const nums = Array.from(ciphertext).map(c => EAM[c]);


  const blocks = [];
  for (let i = 0; i < nums.length; i += 2) {
    blocks.push(nums.slice(i, i + 2));
  }
  const decryptedNums = blocks.flatMap(block => multiplyBlock(block, invMatrix));
  return decryptedNums.map(n => EAM_rev[n]).join('');
}
module.exports = {
  encryptHill,
  decryptHill
};
