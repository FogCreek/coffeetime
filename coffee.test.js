const fs = require('fs');
const coffee = require('./coffee');

const jsonData = fs.readFileSync('coffee.json').toString('utf8');
const data = JSON.parse(jsonData);

function createFakeUsers(){
  const randomNumber = Math.floor(Math.random() * (54 - 4) ) + 4;
  return Array.from({length: randomNumber}, (v, i) => i + 1);
}


test('coffee time should pair everyone', () => {
  const users = createFakeUsers();
  const coffeepairs = coffee.pairUsers(users, '');
  const pairs = coffeepairs.pairs;
  var flattened = pairs.reduce(function(accumulator, currentValue) {
    return accumulator.concat(currentValue);
  }, []);
  expect(flattened).toEqual(expect.arrayContaining(users));
});


test('coffee time should not pair anyone with themseleves', () => {
  const users = createFakeUsers;
    const coffeepairs = coffee.pairUsers(users, '');
  const pairs = coffeepairs.pairs;
  pairs.forEach(function(pair) {
    
});

  

});
