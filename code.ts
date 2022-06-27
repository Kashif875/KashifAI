// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).


// This shows the HTML page in "ui.html".
figma.showUI(__html__);

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = async msg => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.



  let childArrays = []

  if (msg.type === 'create-rectangles') {

    let array = figma.currentPage.selection.length > 0 ? figma.currentPage.selection[0]["children"] : [];

    if (array.length > 0) {

      let currentPage = figma.currentPage.selection[0];

      let pageName = currentPage['name']

      let json = [];

      let width = currentPage['width'];

      let x = 0;

      let endX = width;

      let centerPoint = width / 2;

      let map = new Map<any, any>();



      for (let index = 0; index < array.length; index++) {
        const element = array[index];
        let y = element['y'];

        //Check the type of widget
        if (map.has(y)) {
          let array = [...map.get(y)];
          array.push(element);
          array.sort((a, b) => a["x"] > b["x"] ? 1 : -1);
          map.set(y, array);
        } else {
          let array = [];
          array.push(element);
          map.set(y, array);
        }
      }

      for (const [key, value] of map.entries()) {
        let arr = [...value];
        let childs = await validateUI(value, x, endX, centerPoint, width)
        if (arr.length > 1) {
          let view = {
            type: 'View',
            style: {
              flexDirection: 'row',
              alignItems: 'center',
              alignContent: 'center'
            },
            childNodes: childs
          }
          json.push(view)
        } else {
          json.push(childs[0])
        }
      }
      let finalJson = {
        screenName: pageName.replace(" ", ""),
        data: json
      }

      figma.ui.postMessage({ copiedText: JSON.stringify(finalJson) })
      figma.notify('UI Copied to clipboard');
    } else {
      figma.notify('No Nodes where selected')
    }
  }
  if (msg.type == 'close') {
    figma.closePlugin();

  }

  async function validateUI(array, x, endX, centerPoint, width) {
    let json = [];
    let previousYValue = 0;

    for (let index = 0; index < array.length; index++) {
      const element = array[index];
      console.log(element);

      let type = element['type'];

      if (type == 'RECTANGLE' && element['reactions'].length == 0) {


        let viewStartX = element['x'];
        let viewWidth = element['width'];

        let viewEndX = viewStartX + viewWidth;

        let lastX = width - viewEndX;

        let viewHeight = element['height'];

        let firstGreater;
        let secondGreater;
        if (viewStartX > lastX) {
          firstGreater = viewStartX;
          secondGreater = lastX
        } else {
          firstGreater = lastX;
          secondGreater = viewStartX
        };
        let alignSelf = ''
        let marginStart = 0;
        let marginEnd = 0;
        let minus = firstGreater - secondGreater;


        if (minus <= 3) {
          alignSelf = "center"
        } else if (viewStartX > lastX) {
          marginEnd = lastX;
        } else if (lastX > viewStartX) {
          marginStart = viewStartX;
        }

        let red = await getColorValue(element['fills'][0]['color']['r']);
        let green = await getColorValue(element['fills'][0]['color']['g']);
        let blue = await getColorValue(element['fills'][0]['color']['b']);
        let opacity = await Math.floor(element['fills'][0]['opacity'] * 100);
        let color = rgbToHex(red, green, blue);

        let bgColor = '';

        let cornerRadius = 0;
        let borderTopEndRadius = 0
        let borderTopStartRadius = 0
        let borderBottomEndRadius = 0
        let borderBottomStartRadius = 0

        if (element['cornerRadius']['description'] != undefined
              && element['cornerRadius']['description'] == "figma.mixed") {
          borderBottomStartRadius = element['bottomLeftRadius']
          borderBottomEndRadius = element['bottomRightRadius']
          borderTopStartRadius = element['topLeftRadius']
          borderTopEndRadius = element['topRightRadius']
        } else {
          cornerRadius = element['cornerRadius']
        }

        if (opacity == 0) {
          bgColor = 'transparent'
        } else {
          bgColor = color
        }


        let borderWidth = element['strokeWeight'];
        let borderStartWidth = element['strokeLeftWeight']
        let borderEndWidth = element['strokeRightWeight']
        let borderTopWidth = element['strokeTopWeight']
        let borderBottomWidth = element['strokeBottomWeight'];
        let redStroke = await getColorValue(element['strokes'][0]['color']['r']);
        let greenStroke = await getColorValue(element['strokes'][0]['color']['g']);
        let blueStroke = await getColorValue(element['strokes'][0]['color']['b']);
        let opacityStroke = await Math.floor(element['strokes'][0]['opacity'] * 100);
        let colorStroke = rgbToHex(redStroke, greenStroke, blueStroke);
        
        // if(opacityStroke < 100){
        //   let opacityHash = await getOpacityValues(opacityStroke+"");
        //   let colorWithOpacity = colorStroke.split("#")[1];
        //   let colorHash = opacityHash + colorWithOpacity;
        //   let strokeColor = "#" + colorHash;
        //   colorStroke = strokeColor
        // }


        // let viewEffects = element['effects'];

        // let effectsJson = await getViewEffects(viewEffects);

      
        let style = {
          width: viewWidth,
          height: viewHeight,
          alignSelf,
          marginStart,
          marginEnd,
          backgroundColor: bgColor,
          opacity:opacity / 100,
          borderRadius: cornerRadius,
          borderBottomStartRadius,
          borderBottomEndRadius,
          borderTopEndRadius,
          borderTopStartRadius,
          borderWidth,
          borderBottomWidth,
          borderEndWidth,
          borderStartWidth,
          borderTopWidth,
          borderColor: colorStroke,
        }

        // if(effectsJson){
        //   style = {...style,...effectsJson}
        // }
        if (!alignSelf) {
          delete style['alignSelf']
        }

        if (marginEnd == 0) {
          delete style['marginEnd']
        }

        if (marginStart == 0) {
          delete style['marginStart']
        }

        if (opacity == 10 || opacity == 0) {
          delete style['opacity']
        }

        if (cornerRadius == 0) {
          delete style['borderRadius']
        }

        if (borderTopStartRadius == 0) {
          delete style['borderTopStartRadius']
        }

        if (borderTopEndRadius == 0) {
          delete style['borderTopEndRadius']
        }

        if (borderBottomStartRadius == 0) {
          delete style['borderBottomStartRadius']
        }

        if (borderBottomEndRadius == 0) {
          delete style['borderBottomEndRadius']
        }

        if (borderWidth == 0) {
          delete style['borderWidth']
        }

        if (borderEndWidth == 0) {
          delete style['borderEndWidth']
        }

        if (borderTopWidth == 0) {
          delete style['borderTopWidth']
        }

        if (borderStartWidth == 0) {
          delete style['borderStartWidth']
        }

        if (borderBottomWidth == 0) {
          delete style['borderBottomWidth']
        }

        if (borderWidth == borderEndWidth && borderWidth == borderStartWidth
          && borderWidth == borderBottomWidth && borderWidth == borderTopWidth) {
          delete style['borderStartWidth']
          delete style['borderEndWidth']
          delete style['borderTopWidth']
          delete style['borderBottomWidth']
        } else {
          delete style['borderWidth']
        }

        if (element['strokes'] && element['strokes'].length == 0) {
          delete style['borderColor']
        }


        let obj = {
          type: 'View',
          style: style
        }
        json.push(obj)
      }

      if (element['reactions'].length > 0) {
        //button
      }

      if (element['characters']) {
        let red = await getColorValue(element['fills'][0]['color']['r']);
        let green = await getColorValue(element['fills'][0]['color']['g']);
        let blue = await getColorValue(element['fills'][0]['color']['b']);
        let color = rgbToHex(red, green, blue);
        let letterSpacing = element['letterSpacing']['value'];
        let lineHeight = element['lineHeight']['value'];
        let textDecoration = (element['textDecoration'] + "").toLowerCase();


        let textStartx = element['x'];
        let textStarty = element['y'];
        let textWidth = element['width'];
        let textEndx = textStartx + textWidth;

        let textCenterPoint = (textEndx - textStartx) / 2;
        let finalCenterPt = textCenterPoint + textStartx;

        let textAlign = "";
        let marginEnd = 0;
        let marginStart = 0;

        //Based on previous element margin top need to calculate.
        let marginTop = textStarty - previousYValue;

        previousYValue = textStarty;

        if (array.length == 1) {

          if (centerPoint == finalCenterPt) {
            textAlign = "center"
          } else if (finalCenterPt < centerPoint) {
            marginStart = textStartx - x;
            textAlign = "start"
          } else if (finalCenterPt > centerPoint) {
            marginEnd = endX - textEndx;
            textAlign = "end"
          }

        }

        let fontFamily = (element['fontName']['family'] + "").toLowerCase() + "_" + (element['fontName']['style'] + "").toLowerCase() + ".otf";

        let style = {
          fontSize: element['fontSize'],
          fontFamily,
          color: color,
          letterSpacing: letterSpacing,
          lineHeight,
          textDecoration,
          textAlign,
          marginEnd,
          marginStart,
          marginTop,
        }

        if (fontFamily.includes("bold")) {
          style['fontWeight'] = '600'
        }


        if (fontFamily.includes("thin")) {
          style['fontWeight'] = '300'
        }



        if (fontFamily.includes("medium")) {
          style['fontWeight'] = '500'
        }


        if (style['marginStart'] == 0) {
          delete style['marginStart']
        }

        if (style['marginTop'] == 0) {
          delete style['marginTop']
        }
        if (style['marginEnd'] == 0) {
          delete style['marginEnd']
        }

        if (letterSpacing == 0) {
          delete style['letterSpacing']
        }

        if (lineHeight == 0) {
          delete style['lineHeight']
        }

        if (!textDecoration) {
          delete style['textDecoration']
        }

        if (textDecoration == "none") {
          delete style['textDecoration']
        }

        if (textAlign == "") {
          delete style['textAlign']
        }


        if (textAlign == "center") {
          delete style['marginStart']
          delete style['marginEnd']
        }

        let obj = {
          type: 'Text',
          text: element['characters'],
          style: style
        }
        json.push(obj)
      }

      let fills = element['fills'][0]

      if (fills.type == "IMAGE") {
        const image = figma.getImageByHash(fills.imageHash)
        const bytesData = await image.getBytesAsync();
        let imageWidth = element['width']
        let imageHeight = element['height'];
        figma.ui.postMessage({ isApi: true, bytes: bytesData });

        const newBytes = await new Promise((resolve, reject) => {
          figma.ui.onmessage = value => resolve(value)
        })

        let imageData = {
          type: 'image',
          width: imageWidth,
          height: imageHeight,
          image: newBytes["baseImage"]
        }

        json.push(imageData)
      }
    }

    return json;
  }

  async function groupElements(array) {
    let json = []
    for (let index = 0; index < array.length; index++) {
      const element = array[index];
      let type = element['type'];

      if (type == 'GROUP') {
        let data = await validateChilderens(element);
        json = [...data, ...json]
      } else {
        json.push(element)
      }
    }

    return json;
  }


  async function validateChilderens(element) {
    let childrens = element['children'];

    for await (const iterator of childrens) {
      let type = iterator['type'];
      if (type == 'GROUP') {
        let arr = await validateSubChildrens(iterator);
        childArrays.push(arr);
      } else {
        childArrays.push(iterator)
      }
    }
    return childArrays;
  }

  async function validateSubChildrens(element) {
    let childrens = element['children'];
    let arr = []

    for await (const iterator of childrens) {
      let type = iterator['type'];
      if (type == 'GROUP') {
        let array = await validateSubChildrens(iterator);
        arr.push(array);
      } else {
        arr.push(iterator)
      }
    }
    return arr;
  }


  async function getColorValue(value) {
    let r = parseFloat(value).toFixed(4)
    let percent = parseFloat(r) * 100;
    let finalValue = (percent / 100) * 255
    var nr = finalValue % Math.floor(finalValue)
    nr = Math.round(nr * 100) / 100
    if (nr >= 0.9) {
      finalValue = Math.floor(finalValue + 1);
    } else {
      finalValue = Math.floor(finalValue);
    }
    return Math.ceil(finalValue);
  }
};

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}


async function getOpacityValues(percent) {

  console.log(percent);
  
  let map = new Map<any,any>();

  map.set('100', 'FF')
  map.set('99', 'FC')
  map.set('98', 'FA')
  map.set('97', 'F7')
  map.set('96', 'F5')
  map.set('95', 'F2')
  map.set('94', 'F0')
  map.set('93', 'ED')
  map.set('92', 'EB')
  map.set('91', 'E8')

  map.set('90', 'E6')
  map.set('89', 'E3')
  map.set('88', 'E0')
  map.set('87', 'DE')
  map.set('86', 'DB')
  map.set('85', 'D9')
  map.set('84', 'D6')
  map.set('83', 'D4')
  map.set('82', 'D1')
  map.set('81', 'CF')

  map.set('80', 'CC')
  map.set('79', 'C9')
  map.set('78', 'C7')
  map.set('77', 'C4')
  map.set('76', 'C2')
  map.set('75', 'BF')
  map.set('74', 'BD')
  map.set('73', 'BA')
  map.set('72', 'B8')
  map.set('71', 'B5')

  map.set('70', 'B3')
  map.set('69', 'B0')
  map.set('68', 'AD')
  map.set('67', 'AB')
  map.set('66', 'A8')
  map.set('65', 'A6')
  map.set('64', 'A3')
  map.set('63', 'A1')
  map.set('62', '9E')
  map.set('61', '9C')

  map.set('60', '99')
  map.set('59', '96')
  map.set('58', '94')
  map.set('57', '91')
  map.set('56', '8F')
  map.set('55', '8C')
  map.set('54', '8A')
  map.set('53', '87')
  map.set('52', '85')
  map.set('51', '82')

  map.set('50', '80')
  map.set('49', '7D')
  map.set('48', '7A')
  map.set('47', '78')
  map.set('46', '75')
  map.set('45', '73')
  map.set('44', '70')
  map.set('43', '6E')
  map.set('42', '6B')
  map.set('41', '69')

  map.set('40', '66')
  map.set('39', '63')
  map.set('38', '61')
  map.set('37', '5E')
  map.set('36', '5C')
  map.set('35', '59')
  map.set('34', '57')
  map.set('33', '54')
  map.set('32', '52')
  map.set('31', '4F')

  map.set('30', '4D')
  map.set('29', '4A')
  map.set('28', '47')
  map.set('27', '45')
  map.set('26', '42')
  map.set('25', '40')
  map.set('24', '3D')
  map.set('23', '3B')
  map.set('22', '38')
  map.set('21', '36')

  map.set('20', '33')
  map.set('19', '30')
  map.set('18', '2E')
  map.set('17', '2B')
  map.set('16', '29')
  map.set('15', '26')
  map.set('14', '24')
  map.set('13', '21')
  map.set('12', '1F')
  map.set('11', '1C')

  map.set('10', '1A')
  map.set('9', '17')
  map.set('8', '14')
  map.set('7', '12')
  map.set('6', 'OF')
  map.set('5', '0D')
  map.set('4', '0A')
  map.set('3', '08')
  map.set('2', '05')
  map.set('1', '03')

  return map.get(percent)
}

function getViewEffects(effects){
  if(effects && effects.length > 0){
    return {
      elevation:1
    }
  }
  return undefined
}