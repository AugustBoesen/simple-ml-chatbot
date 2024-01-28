//  Tämä paranneltu versio sisältää kolme paranneltua toimintoa:
//  - yksinkertainen klassifiointi, joka randomisoi vastaukset
//  - yksinkertainen stemmaus, joka korjaa yksinkertaisin säännöin suomen kielen perusperiaatteiden mukaisesti
//  syötettyjä vastauksia ja
//  - chatlog-toiminto, johon viestit tallentuvat ja niitä voidaan tarkastella.

function setText(text) {
  document.getElementById('status').innerText = text;
}

//  tokenisaatio
function trimAndSplit(sentence) {
  const words = sentence
    .replace(/[^a-ö ]/gi, '')
    .toLowerCase()
    .split(' ')
    .filter((x) => !!x);
  return words;
}

// Append-toiminto chat-historialle
function appendMessage(message) {
  const chatHistory = document.getElementById('chat-history');
  const messageElement = document.createElement('p');
  messageElement.textContent = message;
  chatHistory.appendChild(messageElement);
}

// Mallin pohjainen mlchatbot, perustoiminnot ovat mallin mukaiset.
async function mlchatbot() {
  /********Datan esikäsittely********************************************************************/

  const fetchedquestions = await fetch('data/questions.json').then((r) =>
    r.text()
  );
  const fetchedresponses = await fetch('data/responses.json').then((r) =>
    r.text()
  );

  const questions = JSON.parse(fetchedquestions);
  const responses = JSON.parse(fetchedresponses);

  const allWords = [];
  const wordReference = {};

  // tokenisaatio
  questions.forEach((q) => {
    const words = trimAndSplit(q);
    words.forEach((w) => {
      if (!allWords.includes(w)) {
        // jos sana ei jo ole taulukossa
        allWords.push(w); // pushataan sanat taulukkoon
      }
    });
    allWords.forEach((w, i) => {
      wordReference[w] = i;
    });
  });

  // Tehdään kysymyksistä ykkösistä ja nollista muodostuvat taulukot
  const inputs = questions.map((q) => {
    // taulukon pituus on kysymysten sanojen lkm
    const input = new Array(allWords.length).fill(0);

    const words = trimAndSplit(q);
    words.forEach((w) => {
      if (w in wordReference) {
        input[wordReference[w]] = 1;
      }
    });
    return input;
  });

  const outputs = questions.map((q, index) => {
    const output = [];
    for (let i = 0; i < questions.length; i++) {
      output.push(i === index ? 1 : 0);
    }
    return output;
  });

  /*************Modelin luonti ja sen harjoitus***************************************************/

  // Modelin määrittely
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      units: 100,
      activation: 'relu',
      inputShape: [allWords.length],
    })
  );
  model.add(tf.layers.dense({ units: 50, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 25, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 11, activation: 'softmax' }));

  model.compile({
    optimizer: tf.train.adam(),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  // inputit tensoreiksi
  const xs = tf.stack(inputs.map((x) => tf.tensor1d(x)));
  // outputit tensoreksi
  const ys = tf.stack(outputs.map((x) => tf.tensor1d(x)));

  // modelin harjoitus
  await model.fit(xs, ys, {
    epochs: 250,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        setText(`Lataa... Kierros #${epoch}/${250} (${logs.acc})`);
        console.log('Kierros #', epoch, logs);
      },
    },
  });

  setText('Ladattu. Syötä tekstiä kenttään');

  /*************Käyttäjän syötteen vastaanotto ja arviointi modelissa*******************************/

  document
    .getElementById('submit')
    .addEventListener('click', async function () {
      appendMessage('Sinä: ' + document.getElementById('question').value);
      const userinput = stemFinnishWord(
        document.getElementById('question').value
      );
      document.getElementById('question').value = '';

      // trimmataan käyttäjän input
      const trimmedinput = trimAndSplit(userinput);

      console.log(trimmedinput);

      // Luodaan käyttäjän syötteestä vektori eli ykkösiä ja nollia sisältävä taulukko
      const uservector = new Array(allWords.length).fill(0);

      trimmedinput.forEach((w) => {
        if (w in wordReference) {
          uservector[wordReference[w]] = 1;
        }
      });
      console.log('Käyttäjän syöte muutettuna ykkösiksi ja nolliksi: ');
      console.log(uservector);

      // trimmattu käyttäjän syöte mallille tensorina
      const prediction = await model
        .predict(tf.stack([tf.tensor1d(uservector)]))
        .data();

      console.log('Mallin tuottama ennuste: ');
      console.log(prediction);

      // ennusteesta indeksi jossa on suurin luku, todennäköisin vastaus
      const id = prediction.indexOf(Math.max(...prediction));
      // Vakiovastaus jos ennuste on hyvin epävarma
      if (Math.max(...prediction) < 0.3) {
        appendMessage('Botti: Anteeksi, nyt en ymmärtänyt.');
      } else {
        // Randomisoidaan vastaus ala-arraylla, luoden satunnaistoiston eli kevyen muodon intents-jaon
        // Kirjoitetaan HTML-dokumenttiin kysymystä vastaava vastaus
        const randomIndex = Math.floor(Math.random() * responses[id].length);
        const randomResponse = responses[id][randomIndex];
        // document.getElementById('bot-answer').innerText =
        appendMessage('Botti: ' + randomResponse);
      }
    });
}
mlchatbot();
