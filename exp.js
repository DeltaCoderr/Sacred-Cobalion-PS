global.fs = require('fs')
global.expladder = JSON.parse(String(fs.readFileSync('./data/exp.json')));
global.exp = ""
global.addexp = function(name, point){
   if (!Object.keys(expladder).includes(toId(name))){
    expladder[toId(name)] = {name: name, points: point}
  } else{
    expladder[toId(name)] = {name: name, points:expladder[toId(name)].points + point}
  }
  fs.writeFileSync('./data/exp.json', JSON.stringify(expladder))
}
global.getexp = function(name) {
  let pnts = JSON.parse(String(fs.readFileSync('./data/exp.json')));
  if (Object.keys(pnts).includes(toId(name))) return parseInt(pnts[toId(name)]["points"])
}