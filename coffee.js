// data management around coffeetime users

const fs = require('fs');
const shuffle = require('array-shuffle');

const baseUser = {
  slackId: null,
  managerSlackId: null,
  interests: '',
};


const dataFormat = {
  "pairs": [],
  "userData": [],
  "pastMatches": []
}

const DATA_PATH = './.data/coffee.json';

// This function formats the pair generated and outputs a string with the pair
function userPairKey(userA, userB) {
  if (userB < userA) {
    return `${userB}-${userA}`;
  }
  return `${userA}-${userB}`;
}

function pairUsers(users, pastMatches=[], blockedMatches=[]) {

  const blockedMatchesSet = new Set([].concat(blockedMatches, ...pastMatches));

  const pairs = []; // [ [id1, id2], [id3, id4] ] the actual result
  const matches = []; // this will become a new entry in pastMatches

  const shuffledUsers = shuffle(users); // we are biased against the last user

  // who has been added to a group and shouldn't be considered for new groups
  const matchedUsersSet = new Set();

  for (const user of shuffledUsers) {
    if (matchedUsersSet.has(user)) continue;

    // find the first person in the list that we can match with and isn't matched with anybody else
    let match = null;
    for (const potentialUser of shuffledUsers) {
      // don't match people with themselves
      if (potentialUser === user) continue;
      // if the matched users set already has this user, don't match
      if (matchedUsersSet.has(potentialUser)) continue;
      // if they were paired in the recorded past, don't match
      if (blockedMatchesSet.has(userPairKey(user, potentialUser))) continue;
      // ok looks like we can make a match since we checked those things
      match = potentialUser;
      break;
    }

    if (match !== null) {
      // we did find a match
      // put the match we just made in matches
      matches.push(userPairKey(user, match));
      // we put the pair we just made in pairs
      pairs.push([user, match]);
      // we record that we matched the user and their match already so we don't match them again this cycle
      matchedUsersSet.add(user);
      matchedUsersSet.add(match);
    } else if (matchedUsersSet.size === users.length - 1) {
      // we couldn't find anyone because we are the only unmatched person
      // pick a random group to stick them in
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      // so match each one of the randomly selected pair with this sad solo user
      for (const otherUser of pair) {
        matches.push(userPairKey(user, otherUser));
      }
      // put the sad solo user in the pair
      pair.push(user);
      // record that the sad solo user is now paired and not sad
      matchedUsersSet.add(user);
    } else {
      // we couldn't find anyone, remove the oldest history entry and try again
      // if you already were paired with everyone in the company
      // allow you to start pairing with people you've paired with in the past
      return pairUsers(users, pastMatches.splice(1), blockedMatches);
    }
  }

  return { pairs, pastMatches: [...pastMatches, matches] };
}

function createUserList(data) {
  // I did this so I could create users in json in the key-value format like BaseUser not have to also create a userList array with the Ids, we may not need this when subscribe is automated
  const { userData } = data;

  const userList = []
  userData.forEach(function(user) {
    userList.push(user.slackId);
  });
  
  return userList;

}

function createBlockedMatches(data) {
  const blockedMatchesSet = new Set();
  data.userData.forEach(user => {
    if (user.managerSlackId) {
      blockedMatchesSet.add(userPairKey(user.slackId, user.managerSlackId));
    }
  });
  return [...blockedMatchesSet];
}


function loadData() {
  try {
    const data = fs.readFileSync(DATA_PATH).toString('utf8');
    return { ...dataFormat, ...JSON.parse(data) };
  } catch (error) {
    console.warn("didn't load data file:");
    console.warn(error);
    return { ...dataFormat }
  }
}


function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), function (err) {
    if (err) {
      console.warn(err);
    }
  });
}


function runCoffeeTime(){
  const data = loadData();
  const users = createUserList(data);
  const blockedMatches = createBlockedMatches(data);
  const { pastMatches } = data;
  // copy overwrite new stuff to old one wow
  const newData = Object.assign({}, data, pairUsers(users, pastMatches, blockedMatches));
  saveData(newData);
  return newData;
}

function addUser(slackUser) {
  let data = loadData();
  if (checkForUser(slackUser, data)) {
    console.warn(`not adding user ${slackUser.id} twice!`);
    return false;
  }
  console.log('adding', slackUser.id);
  data = addUserToData(slackUser, data);
  saveData(data);
  return true;
}

function checkForUser(slackUser, data) {
  for (let i = 0; i < data.userData.length; i++) {
    if (slackUser.id === data.userData[i].slackId) {
      return true;
    }
  }
  
  return false;
}

function addUserToData(slackUser, data) {
  const userRecord = {
    slackId: slackUser.id,
    name: slackUser.real_name
  };
  data.userData.push(userRecord);
  return data;
}


function removeUser(slackId) {
  const data = loadData();
  for (let i = 0; i < data.userData.length; i++) {
    let user = data.userData[i];
    if (user.slackId === slackId) {
      data.userData.splice(i, 1);
      break;
    }
  }
  saveData(data);
}

module.exports = {
  pairUsers,
  createUserList,
  createBlockedMatches,
  loadData,
  runCoffeeTime,
  addUser,
  removeUser,
  checkForUser,
  addUserToData
};
