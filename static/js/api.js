var radio = [];
var win = false;
var owner = { // Чиновник
  pid: 0,
  name: '',
  rating: -1,
  office: '',
  region: {
    id: 0,
    name: ''
  },
  realmeters: 0, // Указанная в декларации площадь чиновника
  calcmeters: 0, // Расчетная площадь чиновника исходя из дохода
  wage: 0, // Доход чиновника
  year: 1900,
  comments: [],
  hintsVehicles: '',
  hintsEstates: '',
  hintsIncomes: ''
};
var doctor = {
  meters: 0, // Площадь доктора
  wage: 0 // Доход доктора
};
var teacher = {
  meters: 0, // Площадь учителя
  wage: 0 // Доход учителя
};
var scientist = {
  meters: 0, // Площадь ученого
  wage: 0 // Доход ученого
};

function test () {
  var x = new XMLHttpRequest();
  x.open("GET", "https://declarator.org/api/v1/search/person-sections/?name=%D0%B8%D0%B2%D0%B0%D0%BD%D0%BE%D0%B2&page=2", true);
  x.onload = function (){
      alert( x.responseText);
  }
  x.send(null);
};

function playGame (ind) {
  radio = [];
  win = false;
  owner = {};
  teacher = {};
  doctor = {};
  scientist = {};
  var x = new XMLHttpRequest();
  var body = "int=" + ind;
  x.open("POST", "/generate", true);
  x.onload = function (){
      parseGenerate(x.responseText);
    }
  x.onerror = function () {
    owner.wage = 150000;
    radio[0] = 100000;
    radio[1] = 200000;
    radio[2] = 50000;
    radio[3] = 150000;
    owner.hintsVehicles = "Mark: Mercedes Benz W205";
    owner.hintsIncomes = "80 000 rub";
    owner.hintsEstates = "Area: 600 m^2";
    teacher.wage=100000;
    sessionStorage.setItem('teacher.wage', teacher.wage);
    owner.name = 'Alex';
    sessionStorage.setItem('owner.name', owner.name);
    setValues();
    console.log("Working with error");
  }
  x.send(body);
}

function parseGenerate(answer) {
  var parsedAns = JSON.parse(answer);
  if (!parsedAns) {
    console.warn('No data');
    return
  }
  owner = {
    realmeters: parsedAns.realometers || 0,
    calcmeters: parsedAns.ometers || 0,
    wage: parsedAns.owage || 0, // Доход
    pid: parsedAns.pid,
    name: parsedAns.name,
    rating: parsedAns.rating,
    office: parsedAns.office || '',
    region: {
      id: parsedAns.region.id || 0,
      name: parsedAns.region.name || ''
    },
    year: parsedAns.year || 1900,
    comments: parsedAns.comments || '',
    hints: parsedAns.hints
  };
  if (parsedAns.hints && parsedAns.hints.hints) {
    parsedAns.hints.hints
      .filter(h => h.hint_type === 'estate')
      .forEach(h => {
        owner.hintsEstates = String(owner.hintsEstates || '') + String(h.name || '') + '(' + String(h.own_type.name || '') + ')' + ' ' + String(h.square || '') + ' ' + String(h.share || '') + ' ' + String(h.relative || '') + ' ' + String(h.county || '') + ' ' + String(h.region || '') + ' ' + String(h.comment || '') + ','
      })
    if (owner.hintsEstates && owner.hintsEstates.length > 0) {
      owner.hintsEstates.substring(0, owner.hintsEstates.length - 1)
    }

    parsedAns.hints.hints
      .filter(h => h.hint_type === 'income')
      .forEach(h => {
        owner.hintsIncomes = String(owner.hintsIncomes || '') + String(h.relative || '') + ' ' + String(h.size || '') + ' ' + String(h.comment || '') + ', '
      })
    if (owner.hintsIncomes && owner.hintsIncomes.length > 0) {
      owner.hintsIncomes.substring(0, owner.hintsIncomes.length - 1)
    }

    parsedAns.hints.hints
      .filter(h => h.hint_type === 'vehicle')
      .forEach(h => {
        owner.hintsVehicles = String(owner.hintsVehicles || '') + (h.relative || '') + ' ' + String(h.type.name || '') + ' '  + String(h.name || '') + ' ' + String(h.comment || '') + ', '
      })
    if (owner.hintsVehicles && owner.hintsVehicles.length > 0) {
      owner.hintsVehicles.substring(0, owner.hintsVehicles.length - 1)
    };
  };

  doctor = {
    meters: parsedAns.dmeters || 0,
    wage: parsedAns.dwage || 0
  };
  teacher = {
     meters: parsedAns.tmeters || 0,
     wage: parsedAns.twage || 0
  };
  scientist = {
    meters: parsedAns.smeters || 0,
    wage: parsedAns.swage || 0
  };
  sessionStorage.setItem('owner.realmeters', owner.realmeters);
  sessionStorage.setItem('owner.calcmeters', owner.calcmeters);
  sessionStorage.setItem('owner.wage', owner.wage);
  sessionStorage.setItem('owner.about', owner.name + ' ' + owner.comments || '');
  sessionStorage.setItem('owner.region.name', owner.region.name);
  sessionStorage.setItem('teacher.wage', teacher.wage);
  sessionStorage.setItem('teacher.meters', teacher.meters);
  sessionStorage.setItem('doctor.wage', doctor.wage);
  sessionStorage.setItem('doctor.meters', teacher.meters);
  sessionStorage.setItem('scientist.wage', scientist.wage);
  sessionStorage.setItem('scientist.meters', scientist.meters);
  randomVals();
  setValues();
}

function randomVals () {
  var rnd = Math.random();
  if (rnd < 0.25) {
    radio[0] = owner.wage.toFixed(2);
    radio[1] = (Math.random() < 0.5 ? 40000 + owner.wage : owner.wage - 40000).toFixed(2);
    radio[2] = (Math.random() < 0.5 ? owner.wage * 2 : owner.wage / 2).toFixed(2);
    radio[3] = (Math.random() < 0.5 ? owner.wage * 0.2: owner.wage / 0.2).toFixed(2);
  } else if (rnd < 0,5) {
    radio[0] = (Math.random() < 0.5 ? 50000 + owner.wage : owner.wage - 50000).toFixed(2);
    radio[1] = (owner.wage).toFixed(2);
    radio[2] = (Math.random() < 0.5 ? owner.wage * 0.3: owner.wage / 0.3).toFixed(2);
    radio[3] = (Math.random() < 0.5 ? owner.wage * 1.5 : owner.wage / 1.5).toFixed(2);
  } else if (rnd < 0,75) {
    radio[0] = (Math.random() < 0.5 ? owner.wage * 1.4 : owner.wage / 1.4).toFixed(2);
    radio[1] = (Math.random() < 0.5 ? owner.wage * 0.6: owner.wage / 0.6).toFixed(2);
    radio[2] = (owner.wage).toFixed(2);
    radio[3] = (Math.random() < 0.5 ? 31000 + owner.wage : owner.wage - 31000).toFixed(2);
  } else {
    radio[0] = (Math.random() < 0.5 ? owner.wage * 1.4 : owner.wage / 1.4).toFixed(2);
    radio[1] = (Math.random() < 0.5 ? owner.wage * 0.6: owner.wage / 0.6).toFixed(2);
    radio[2] = (Math.random() < 0.5 ? 31000 + owner.wage : owner.wage - 31000).toFixed(2);
    radio[3] = (owner.wage).toFixed(2);
  }
}

function setValues() {
  // document.getElementById('radio_container').style.visibility = 'hidden';
  // document.getElementById('radio_container').style.height = '0px';
  document.getElementById('obertka').children[0].innerHTML = "<input id='num1' type='radio' name='dengi' style='height:13px;width:13px;margin:auto;' min='0' max='1000000000000' size='3' value=0>" + String(radio[0]) + " ₽/month";
  document.getElementById('obertka').children[2].innerHTML = "<input id='num2' type='radio' name='dengi' style='height:13px;width:13px;margin:auto;' min='0' max='1000000000000' size='3' value=1>" + String(radio[1]) + " ₽/month";
  document.getElementById('obertka').children[4].innerHTML = "<input id='num3' type='radio' name='dengi' style='height:13px;width:13px;margin:auto;' min='0' max='1000000000000' size='3' value=2>" + String(radio[2]) + " ₽/month";
  document.getElementById('obertka').children[6].innerHTML = "<input id='num4' type='radio' name='dengi' style='height:13px;width:13px;margin:auto;' min='0' max='1000000000000' size='3' value=3>" + String(radio[3]) + " ₽/month";
  if (owner.hintsVehicles && owner.hintsVehicles.length > 0) {
    document.getElementById('car').style.visibility = 'visible';
    document.getElementById('car').style.height = 'auto';
    document.getElementById('car_one').innerText = owner.hintsVehicles;
  }
  if (owner.hintsEstates && owner.hintsEstates.length > 0) {
    document.getElementById('dom').style.visibility = 'visible';
    document.getElementById('dom').style.height = 'auto';
    document.getElementById('dom_one').innerText = owner.hintsEstates;
  }
  if (owner.hintsIncomes && owner.hintsIncomes.length > 0) {
    document.getElementById('vklad').style.visibility = 'visible';
    document.getElementById('vklad').style.height = 'auto';
    document.getElementById('vklad_one').innerText = owner.hintsIncomes;
  }
  document.getElementById('obertka').style.height = 'auto';
  document.getElementById('obertka').style.visibility = 'visible';
}

function checkChoise() {
  var rad=document.getElementsByName('dengi');
  for (var i=0;i<rad.length; i++) {
      if (rad[i].checked) {
          if (radio[i] === owner.wage) {
            win = true;
          }
          sessionStorage.setItem('inputSalary', rad[i]);
      }
  };
  if (win === true) {
    win = false;
    console.log('You win!')
    document.location.href = "answer.html"
  } else {
    document.location.href = "index-u.html";
  }

}
