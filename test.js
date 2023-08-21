const fs = require('fs')


fs.readFile('beam/css/dynamic.css', 'utf8', function(err, data){
    const hexCharacters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
    function getRandomCharacter() {
        const randomIndex = Math.floor(Math.random() * hexCharacters.length);
        return hexCharacters[randomIndex];
    }
    function generateRandomHexColor() {
        let hexColor = '#';
        for (let i = 0; i < 6; i++) {
            hexColor += getRandomCharacter();
        }
        return hexColor;
    }
    random_color = generateRandomHexColor()
    const hex = /#[A-Fa-f0-9]{6}\b/g;
    const modifiedData = data.replace(hex, random_color);
    fs.writeFile("beam/css/dynamic.css", modifiedData,
      {
        encoding: "utf8",
      },
      (err) => {
        if (err)
          console.log(err);
    });
});
