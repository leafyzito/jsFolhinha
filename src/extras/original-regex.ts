export class CreateRegex {
  static instance: CreateRegex;

  public readonly specialCharacters: [string, RegExp][] = Object.entries({
    L: /ł/gim,
    O: /ø/gim,
    AE: /æ/gim,
    SS: /ß/gim,
  });

  /** Source https://github.com/frandiox/normalize-unicode-text/ */
  public readonly replacements: [RegExp, string][] = [
    [/[\u0300-\u036F]/g, ""], // accents
    [/[\u180E\u200B-\u200D\u2060\uFEFF]/g, ""], // zero-width
    [/[\u2420\u2422\u2423]/g, " "], // visible special space chars
    [/[ \u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " "], // space characters
    [/\s+/g, " "], // new lines and tabs
  ];

  /** The current cache of all the supported alphabet characters  */
  public readonly alphabetMap = new Map<string, string[]>();

  /** The current cache of all the supported confusable characters */
  public readonly confusablesMap = new Map<string, string>();

  /** Source https://github.com/gc/confusables/ */
  public readonly confusables = new Map<string, string>([
    [" ", " "],
    ["0", "⓿"],
    ["1", "11⓵➊⑴¹𝟏𝟙１𝟷𝟣⒈𝟭1➀₁①❶⥠"],
    ["2", "⓶⒉⑵➋ƻ²ᒿ𝟚２𝟮𝟤ᒾ𝟸Ƨ𝟐②ᴤ₂➁❷ᘝƨ"],
    ["3", "³ȝჳⳌꞫ𝟑ℨ𝟛𝟯𝟥Ꝫ➌ЗȜ⓷ӠƷ３𝟹⑶⒊ʒʓǯǮƺ𝕴ᶾзᦡ➂③₃ᶚᴣᴟ❸ҘҙӬӡӭӟӞ"],
    ["4", "𝟰𝟺𝟦𝟒➍ҶᏎ𝟜ҷ⓸ҸҹӴӵᶣ４чㄩ⁴➃₄④❹Ӌ⑷⒋"],
    ["5", "𝟱⓹➎Ƽ𝟓𝟻𝟝𝟧５➄₅⑤⁵❺ƽ⑸⒌"],
    ["6", "Ⳓ🄇𝟼Ꮾ𝟲𝟞𝟨𝟔➏⓺Ϭϭ⁶б６ᧈ⑥➅₆❻⑹⒍"],
    ["7", "𝟕𝟟𝟩𝟳𝟽🄈⓻𐓒➐７⁷⑦₇❼➆⑺⒎"],
    ["8", "𐌚🄉➑⓼８𝟠𝟪৪⁸₈𝟴➇⑧❽𝟾𝟖⑻⒏"],
    ["9", "൭Ꝯ𝝑𝞋𝟅🄊𝟡𝟵Ⳋ⓽➒੧৭୨９𝟫𝟿𝟗⁹₉Գ➈⑨❾⑼⒐"],
    ["10", "⓾❿➉➓🔟⑩⑽⒑"],
    ["11", "⑪⑾⒒⓫"],
    ["12", "⑫⑿⒓⓬"],
    ["13", "⑬⒀⒔⓭"],
    ["14", "⑭⒁⒕⓮"],
    ["15", "⑮⒂⒖⓯"],
    ["16", "⑯⒃⒗⓰"],
    ["17", "⑰⒄⒘⓱"],
    ["18", "⑱⒅⒙⓲"],
    ["19", "⑲⒆⒚⓳"],
    ["20", "⑳⒇⒛⓴"],
    ["ae", "æ"],
    ["OE", "Œ"],
    ["oe", "œ"],
    ["pi", "ᒆ"],
    ["Nj", "ǋ"],
    ["AE", "ᴁ"],
    [
      "A",
      "𝑨𝔄ᗄ𝖠𝗔ꓯ𝞐🄐🄰Ꭿ𐊠𝕬𝜜𝐴ꓮᎪ𝚨ꭺ𝝖🅐Å∀🇦₳🅰𝒜𝘈𝐀𝔸дǺᗅⒶＡΑᾋᗩĂÃÅǍȀȂĀȺĄʌΛλƛᴀᴬДАልÄₐᕱªǞӒΆẠẢẦẨẬẮẰẲẴẶᾸᾹᾺΆᾼᾈᾉᾊᾌᾍᾎᾏἈἉἊἋἌἍἎἏḀȦǠӐÀÁÂẤẪ𝛢𝓐𝙰𝘼ᗩ",
    ],
    [
      "a",
      "∂⍺ⓐձǟᵃᶏ⒜аɒａαȃȁคǎმäɑāɐąᾄẚạảǡầẵḁȧӑӓãåάὰάăẩằẳặᾀᾁᾂᾃᾅᾆᾰᾱᾲᾳᾴᶐᾶᾷἀἁἂἃἄἅἆἇᾇậắàáâấẫǻⱥ𝐚𝑎𝒂𝒶𝓪𝔞𝕒𝖆𝖺𝗮𝘢𝙖𝚊𝛂𝛼𝜶𝝰𝞪⍶",
    ],
    [
      "B",
      "🄑𝔙𝖁ꞵ𝛃𝛽𝜷𝝱𝞫Ᏸ𐌁𝑩𝕭🄱𐊡𝖡𝘽ꓐ𝗕𝘉𝜝𐊂𝚩𝐁𝛣𝝗𝐵𝙱𝔹Ᏼᏼ𝞑Ꞵ𝔅🅑฿𝓑ᗿᗾᗽ🅱ⒷＢвϐᗷƁ乃ßცჩ๖βɮБՅ๒ᙖʙᴮᵇጌḄℬΒВẞḂḆɃദᗹᗸᵝᙞᙟᙝᛒᙗᙘᴃ🇧",
    ],
    ["b", "ꮟᏏ𝐛𝘣𝒷𝔟𝓫𝖇𝖻𝑏𝙗𝕓𝒃𝗯𝚋♭ᑳᒈｂᖚᕹᕺⓑḃḅҍъḇƃɓƅᖯƄЬᑲþƂ⒝ЪᶀᑿᒀᒂᒁᑾьƀҌѢѣᔎ"],
    [
      "C",
      "ꞆႠ℃🄒ᏟⲤ🄲ꓚ𐊢𐌂🅲𐐕🅒☾ČÇⒸＣↃƇᑕㄈ¢८↻ĈϾՇȻᙅᶜ⒞ĆҀĊ©टƆℂℭϹС匚ḈҪʗᑖᑡᑢᑣᑤᑥⅭ𝐂𝐶𝑪𝒞𝓒𝕮𝖢𝗖𝘊𝘾ᔍ",
    ],
    [
      "c",
      "🝌ｃⅽ𝐜𝑐𝒄𝒸𝓬𝔠𝕔𝖈𝖼𝗰𝘤𝙘𝚌ᴄϲⲥсꮯ𐐽ⲥ𐐽ꮯĉｃⓒćčċçҁƈḉȼↄсርᴄϲҫ꒝ςɽϛ𝙲ᑦ᧚𝐜𝑐𝒄𝒸𝓬𝔠𝕔𝖈𝖼𝗰𝘤𝙘𝚌₵🇨ᥴᒼⅽ",
    ],
    ["D", "🄓Ꭰ🄳𝔡𝖉𝔻𝗗𝘋𝙳𝐷𝓓𝐃𝑫𝕯𝖣𝔇𝘿ꭰⅅ𝒟ꓓ🅳🅓ⒹＤƉᗪƊÐԺᴅᴰↁḊĐÞⅮᗞᑯĎḌḐḒḎᗫᗬᗟᗠᶛᴆ🇩"],
    ["d", "Ꮷ𝔡𝖉ᑯꓒ𝓭ᵭ₫ԃⓓｄḋďḍḑḓḏđƌɖɗᵈ⒟ԁⅾᶁԀᑺᑻᑼᑽᒄᑰᑱᶑ𝕕𝖽𝑑𝘥𝒅𝙙𝐝𝗱𝚍ⅆ𝒹ʠժ"],
    [
      "E",
      "£ᙓ⋿∃ⴺꓱ𝐄𝐸𝔈𝕰𝖤𝘌𝙴𝛦𝜠ꭼ🄔🄴𝙀𝔼𐊆𝚬ꓰ𝝚𝞔𝓔𝑬𝗘🅴🅔ⒺΈＥƎἝᕮƐモЄᴇᴱᵉÉ乇ЁɆꂅ€ÈℰΕЕⴹᎬĒĔĖĘĚÊËԐỀẾỄỂẼḔḖẺȄȆẸỆȨḜḘḚἘἙἚἛἜῈΈӖὲέЀϵ🇪",
    ],
    [
      "e",
      "əәⅇꬲꞓ⋴𝛆𝛜𝜀𝜖𝜺𝝐𝝴𝞊𝞮𝟄ⲉꮛ𐐩ꞒⲈ⍷𝑒𝓮𝕖𝖊𝘦𝗲𝚎𝙚𝒆𝔢𝖾𝐞Ҿҿⓔｅ⒠èᧉéᶒêɘἔềếễ૯ǝєεēҽɛểẽḕḗĕėëẻěȅȇẹệȩɇₑęḝḙḛ℮еԑѐӗᥱёἐἑἒἓἕℯ",
    ],
    ["F", "ᖵꘘꓞꟻᖷ𝐅𝐹𝑭𝔽𝕱𝖥𝗙𝙁𝙵𝟊℉🄕🄵𐊇𝔉𝘍𐊥ꓝꞘ🅵🅕𝓕ⒻＦғҒᖴƑԲϝቻḞℱϜ₣🇫Ⅎ"],
    ["f", "𝐟ᵮ𝑓𝒇𝒻𝓯𝔣𝕗𝖿𝗳𝙛𝚏ꬵꞙẝ𝖋ⓕｆƒḟʃբᶠ⒡ſꊰʄ∱ᶂ𝘧"],
    ["G", "𝗚𝘎🄖ꓖᏳ🄶Ꮐᏻ𝔾𝓖𝑮𝕲ꮐ𝒢𝙂𝖦𝙶𝔊𝐺𝐆🅶🅖ⒼＧɢƓʛĢᘜᴳǴĠԌĜḠĞǦǤԍ₲🇬⅁"],
    ["g", "ᶃᶢⓖｇǵĝḡğġǧģց૭ǥɠﻭﻮᵍ⒢ℊɡᧁ𝐠𝑔𝒈𝓰𝔤𝕘𝖌𝗀𝗴𝘨𝙜𝚐"],
    [
      "H",
      "Ἤ🄗𝆦🄷𝜢ꓧ𝘏𝐻𝝜𝖧𐋏𝗛ꮋℍᎻℌⲎ𝑯𝞖🅷🅗ዞǶԋⒽＨĤᚺḢḦȞḤḨḪĦⱧҢңҤῊΉῌἨἩἪἫἭἮἯᾘᾙᾚᾛᾜᾝᾞᾟӉӈҥΉн卄♓𝓗ℋН𝐇𝙃𝙷ʜ𝛨Η𝚮ᕼӇᴴᵸ🇭",
    ],
    ["h", "ꞕ৸𝕳ꚕᏲℏӊԊꜧᏂҺ⒣ђⓗｈĥḣḧȟḥḩḫẖħⱨհһከኩኪካɦℎ𝐡𝒉𝒽𝓱𝔥𝕙𝖍𝗁𝗵𝘩𝙝𝚑իʰᑋᗁɧんɥ"],
    [
      "I",
      "ⲒἿ🄘🄸ЇꀤᏆ🅸🅘إﺇٳأﺃٲٵⒾＩ៸ÌÍÎĨĪĬİÏḮỈǏȈȊỊĮḬƗェエῘῙῚΊἸἹἺἻἼἽἾⅠΪΊɪᶦᑊᥣ𝛪𝐈𝙄𝙸𝓵𝙡𝐼ᴵ𝚰𝑰🇮",
    ],
    [
      "i",
      "⍳ℹⅈ𝑖𝒊𝒾ı𝚤ɩιιͺ𝛊𝜄𝜾𝞲ꙇӏꭵᎥⓘｉìíîĩīĭïḯỉǐȉȋịḭῐῑῒΐῖῗἰἱἲⅰⅼ∣ⵏ￨׀ا١۱ߊᛁἳἴἵɨіὶίᶖ𝔦𝚒𝝸𝗂𝐢𝕚𝖎𝗶𝘪𝙞ίⁱᵢ𝓲⒤",
    ],
    ["J", "𝐉𝐽𝑱𝒥𝓙𝔍𝕁𝕵𝖩𝗝𝘑𝙅𝙹ꞲͿꓙ🄙🄹🅹🅙ⒿＪЈʝᒍנﾌĴʆวلյʖᴊᴶﻝጋɈⱼՂๅႱįᎫȷ丿ℐℑᒘᒙᒚᒛᒴᒵᒎᒏ🇯"],
    ["j", "𝚥ꭻⅉⓙｊϳʲ⒥ɉĵǰјڶᶨ𝒿𝘫𝗷𝑗𝙟𝔧𝒋𝗃𝓳𝕛𝚓𝖏𝐣"],
    ["K", "𝐊ꝄꝀ𝐾𝑲𝓚𝕶𝖪𝙺𝚱𝝟🄚𝗞🄺𝜥𝘒ꓗ𝙆𝕂Ⲕ𝔎𝛫Ꮶ𝞙𝒦🅺🅚₭ⓀＫĸḰќƘкҠκқҟӄʞҚКҡᴋᴷᵏ⒦ᛕЌጕḲΚKҜҝҞĶḴǨⱩϗӃ🇰"],
    ["k", "ⓚꝁｋḱǩḳķḵƙⱪᶄ𝐤𝘬𝗄𝕜𝜅𝜘𝜿𝝒𝝹𝞌𝞳𝙠𝚔𝑘𝒌ϰ𝛋𝛞𝟆𝗸𝓴𝓀"],
    [
      "L",
      "𝐋𝐿𝔏𝕃𝕷𝖫𝗟𝘓𝙇ﴼ🄛🄻𐐛Ⳑ𝑳𝙻𐑃𝓛ⳑꮮᏞꓡ🅻🅛ﺈ└ⓁւＬĿᒪ乚ՆʟꓶιԼᴸˡĹረḶₗΓլĻᄂⅬℒⱢᥧᥨᒻᒶᒷᶫﺎᒺᒹᒸᒫ⎳ㄥŁⱠﺄȽ🇱",
    ],
    ["l", "ⓛｌŀĺľḷḹļӀℓḽḻłﾚɭƚɫⱡ|Ɩ⒧ʅǀוןΙІ｜ᶩӏ𝓘𝕀𝖨𝗜𝘐𝐥𝑙𝒍𝓁𝔩𝕝𝖑𝗅𝗹𝘭𝚕𝜤𝝞ı𝚤ɩι𝛊𝜄𝜾𝞲"],
    ["M", "ꮇ🄜🄼𐌑𐊰ꓟⲘᎷ🅼🅜ⓂＭмṂ൱ᗰ州ᘻო๓♏ʍᙏᴍᴹᵐ⒨ḾМṀ௱ⅯℳΜϺᛖӍӎ𝐌𝑀𝑴𝓜𝔐𝕄𝕸𝖬𝗠𝘔𝙈𝙼𝚳𝛭𝜧𝝡𝞛🇲"],
    ["m", "₥ᵯ𝖒𝐦𝗆𝔪𝕞𝓂ⓜｍനᙢ൩ḿṁⅿϻṃጠɱ៳ᶆ𝙢𝓶𝚖𝑚𝗺᧕᧗"],
    [
      "N",
      "𝇙𝇚𝇜🄝𝆧𝙉🄽ℕꓠ𝛮𝝢𝙽𝚴𝑵𝑁Ⲛ𝐍𝒩𝞜𝗡𝘕𝜨𝓝𝖭🅽₦🅝ЙЍⓃҋ៷ＮᴎɴƝᑎ几иՈռИהЛπᴺᶰŃ刀ክṄⁿÑПΝᴨոϖǸŇṆŅṊṈทŊӢӣӤӥћѝйᥢҊᴻ🇳",
    ],
    [
      "n",
      "ոռח𝒏𝓷𝙣𝑛𝖓𝔫𝗇𝚗𝗻ᥒⓝήｎǹᴒńñᾗηṅňṇɲņṋṉղຖՌƞŋ⒩ภกɳпŉлԉȠἠἡῃդᾐᾑᾒᾓᾔᾕᾖῄῆῇῂἢἣἤἥἦἧὴήበቡቢባቤብቦȵ𝛈𝜂𝜼𝝶𝞰𝕟𝘯𝐧𝓃ᶇᵰᥥ∩",
    ],
    [
      "O",
      "𝜽⭘🔿ꭴ⭕⏺🄁🄀Ꭴ𝚯𝚹𝛩𝛳𝜣𝜭𝝝𝝧𝞗𝞡ⴱᎾᏫ⍬𝞱𝝷𝛉𝟎𝜃θ𝟘𝑂𝑶𝓞𝔒𝕆𝕺𝗢𝘖𝙊𝛰㈇ꄲ🄞🔾🄾𐊒𝟬ꓳⲞ𐐄𐊫𐓂𝞞🅞⍥◯ⵁ⊖０⊝𝝤Ѳϴ𝚶𝜪ѺӦӨӪΌʘ𝐎ǑÒŎÓÔÕȌȎㇿ❍ⓄＯὋロ❤૦⊕ØФԾΘƠᴼᵒ⒪ŐÖₒ¤◊Φ〇ΟОՕଠഠ௦סỒỐỖỔṌȬṎŌṐṒȮȰȪỎỜỚỠỞỢỌỘǪǬǾƟⵔ߀៰⍜⎔⎕⦰⦱⦲⦳⦴⦵⦶⦷⦸⦹⦺⦻⦼⦽⦾⦿⧀⧁⧂⧃ὈὉὊὌὍ",
    ],
    [
      "o",
      "ంಂംං૦௦۵ℴ𝑜𝒐𝖔ꬽ𝝄𝛔𝜎𝝈𝞂ჿ𝚘০୦ዐ𝛐𝗈𝞼ဝⲟ𝙤၀𐐬𝔬𐓪𝓸🇴⍤○ϙ🅾𝒪𝖮𝟢𝟶𝙾𝘰𝗼𝕠𝜊𝐨𝝾𝞸ᐤⓞѳ᧐ᥲðｏఠᦞՓòөӧóºōôǒȏŏồốȍỗổõσṍȭṏὄṑṓȯȫ๏ᴏőöѻоዐǭȱ০୦٥౦೦൦๐໐οօᴑ०੦ỏơờớỡởợọộǫøǿɵծὀὁόὸόὂὃὅ",
    ],
    ["P", "🄟🄿ꓑ𝚸𝙿𝞠𝙋ꮲⲢ𝒫𝝦𝑃𝑷𝗣𝐏𐊕𝜬𝘗𝓟𝖯𝛲Ꮲ🅟Ҏ🅿ⓅＰƤᑭ尸Ṗրφքᴘᴾᵖ⒫ṔｱקРየᴩⱣℙΡῬᑸᑶᑷᑹᑬᑮ🇵₱"],
    ["p", "ⲣҏ℗ⓟｐṕṗƥᵽῥρрƿǷῤ⍴𝓹𝓅𝐩𝑝𝒑𝔭𝕡𝖕𝗉𝗽𝘱𝙥𝚙𝛒𝝆𝞺𝜌𝞀"],
    ["Q", "🅀🄠Ꝗ🆀🅠ⓆＱℚⵕԚ𝐐𝑄𝑸𝒬𝓠𝚀𝘘𝙌𝖰𝕼𝔔𝗤🇶"],
    ["q", "𝓆ꝗ𝗾ⓠｑգ⒬۹զᑫɋɊԛ𝗊𝑞𝘲𝕢𝚚𝒒𝖖𝐪𝔮𝓺𝙦"],
    ["R", "℞🄡℟ꭱᏒ𐒴ꮢᎡꓣ🆁🅡ⓇＲᴙȒʀᖇя尺ŔЯરƦᴿዪṚɌʁℛℜℝṘŘȐṜŖṞⱤ𝐑𝑅𝑹𝓡𝕽𝖱𝗥𝘙𝙍𝚁ᚱ🇷ᴚ"],
    ["r", "𝚛ꭇᣴℾ𝚪𝛤𝜞𝝘𝞒ⲄГᎱᒥꭈⲅꮁⓡｒŕṙřȑȓṛṝŗгՐɾᥬṟɍʳ⒭ɼѓᴦᶉ𝐫𝑟𝒓𝓇𝓻𝔯𝕣𝖗𝗋𝗿𝘳𝙧ᵲґᵣ"],
    ["S", "🅂🄪🄢ꇙ𝓢𝗦Ꮪ𝒮Ꮥ𝚂𝐒ꓢ𝖲𝔖𝙎𐊖𝕾𐐠𝘚𝕊𝑆𝑺🆂🅢ⓈＳṨŞֆՏȘˢ⒮ЅṠŠŚṤŜṦṢടᔕᔖᔢᔡᔣᔤ"],
    ["s", "ᣵⓢꜱ𐑈ꮪｓśṥŝṡšṧʂṣṩѕşșȿᶊక𝐬𝑠𝒔𝓈𝓼𝔰𝕤𝖘𝗌𝘀𝘴𝙨𝚜ގ🇸"],
    [
      "T",
      "🅃🄣七ፒ𝜯🆃𐌕𝚻𝛵𝕋𝕿𝑻𐊱𐊗𝖳𝙏🝨𝝩𝞣𝚃𝘛𝑇ꓔ⟙𝐓Ⲧ𝗧⊤𝔗Ꭲꭲ𝒯🅣⏇⏉ⓉＴтҬҭƬイŦԵτᴛᵀｲፕϮŤ⊥ƮΤТ下ṪṬȚŢṰṮ丅丁ᐪ𝛕𝜏𝝉𝞃𝞽𝓣ㄒ🇹ጥ",
    ],
    ["t", "ⓣｔṫẗťṭțȶ੮էʇ†ţṱṯƭŧᵗ⒯ʈեƫ𝐭𝑡𝒕𝓉𝓽𝔱𝕥𝖙𝗍𝘁𝘵𝙩𝚝ナ"],
    [
      "U",
      "🅄Џ🄤ሀꓴ𐓎꒤🆄🅤ŨŬŮᑗᑘǓǕǗǙⓊＵȖᑌ凵ƱմԱꓵЦŪՄƲᙀᵁᵘ⒰ŰપÜՍÙÚÛṸṺǛỦȔƯỪỨỮỬỰỤṲŲṶṴɄᥩᑧ∪ᘮ⋃𝐔𝑈𝑼𝒰𝓤𝔘𝕌𝖀𝖴𝗨𝘜𝙐𝚄🇺",
    ],
    [
      "u",
      "𝘂𝘶𝙪𝚞ꞟꭎꭒ𝛖𝜐𝝊𝞄𝞾𐓶ὺύⓤｕùũūừṷṹŭǖữᥙǚǜὗυΰนսʊǘǔúůᴜűųยûṻцሁüᵾᵤµʋủȕȗưứửựụṳṵʉῠῡῢΰῦῧὐὑϋύὒὓὔὕὖᥔ𝐮𝑢𝒖𝓊𝓾𝔲𝕦𝖚𝗎ᶙ",
    ],
    ["V", "𝑉𝒱𝕍𝗩🄥🅅ꓦ𝑽𝖵𝘝Ꮩ𝚅𝙑𝐕🆅🅥ⓋＶᐯѴᵛ⒱۷ṾⅴⅤṼ٧ⴸѶᐺᐻ🇻𝓥"],
    ["v", "∨⌄⋁ⅴ𝐯𝑣𝒗𝓋𝔳𝕧𝖛𝗏ꮩሀⓥｖ𝜐𝝊ṽṿ౮งѵעᴠνטᵥѷ៴ᘁ𝙫𝚟𝛎𝜈𝝂𝝼𝞶𝘷𝘃𝓿"],
    ["W", "𝐖𝑊𝓦𝔚𝕎𝖂𝖶𝗪𝙒𝚆🄦🅆ᏔᎳ𝑾ꓪ𝒲𝘞🆆Ⓦ🅦ｗＷẂᾧᗯᥕ山ѠຟచաЩШώщฬшᙎᵂʷ⒲ฝሠẄԜẀŴẆẈധᘺѿᙡƜ₩🇼"],
    ["w", "𝐰ꝡ𝑤𝒘𝓌𝔀𝔴𝕨𝖜𝗐𝘄𝘸𝙬𝚠աẁꮃẃⓦ⍵ŵẇẅẘẉⱳὼὠὡὢὣωὤὥὦὧῲῳῴῶῷⱲѡԝᴡώᾠᾡᾢᾣᾤᾥᾦɯ𝝕𝟉𝞏"],
    [
      "X",
      "ꭓꭕ𝛘𝜒𝝌𝞆𝟀ⲭ🞨𝑿𝛸🄧🞩🞪🅇🞫🞬𐌗Ⲭꓫ𝖃𝞦𝘟𐊐𝚾𝝬𝜲Ꭓ𐌢𝖷𝑋𝕏𝔛𐊴𝗫🆇🅧❌Ⓧ𝓧ＸẊ᙭χㄨ𝒳ӾჯӼҳЖΧҲᵡˣ⒳אሸẌꊼⅩХ╳᙮ᕁᕽⅹᚷⵝ𝙓𝚇乂𝐗🇽",
    ],
    ["x", "᙮ⅹ𝑥𝒙𝓍𝔵𝕩𝖝𝗑𝘅ᕁᕽⓧｘхẋ×ₓ⤫⤬⨯ẍᶍ𝙭ӽ𝘹𝐱𝚡⨰ﾒ𝔁"],
    [
      "Y",
      "𝒴🄨𝓨𝔜𝖄𝖸𝘠𝙔𝚼𝛶𝝪𝞤УᎩᎽⲨ𝚈𝑌𝗬𝐘ꓬ𝒀𝜰𐊲🆈🅨ⓎＹὛƳㄚʏ⅄ϔ￥¥ՎϓγץӲЧЎሃŸɎϤΥϒҮỲÝŶỸȲẎỶỴῨῩῪΎὙὝὟΫΎӮӰҰұ𝕐🇾",
    ],
    ["y", "𝐲𝑦𝒚𝓎𝔂𝔶𝕪𝖞𝗒𝘆𝘺𝙮𝚢ʏỿꭚγℽ𝛄𝛾𝜸𝝲𝞬🅈ᎽᎩⓨｙỳýŷỹȳẏÿỷуყẙỵƴɏᵞɣʸᶌү⒴ӳӱӯўУʎ"],
    ["Z", "🄩🅉ꓜ𝗭𝐙☡Ꮓ𝘡🆉🅩ⓏＺẔƵ乙ẐȤᶻ⒵ŹℤΖŻŽẒⱫ🇿"],
    ["z", "𝑍𝒁𝒵𝓩𝖹𝙕𝚉𝚭𝛧𝜡𝝛𝞕ᵶꮓ𝐳𝑧𝒛𝓏𝔃𝔷𝕫𝖟𝗓𝘇𝘻𝙯𝚣ⓩｚźẑżžẓẕƶȥɀᴢጊʐⱬᶎʑᙆ"],
  ]);

  private _emojis: RegExp;

  private _indirect_pings: RegExp;

  private _invisChars: RegExp;

  private _racism: RegExp;

  private _racism2: RegExp;

  private _racism3: RegExp;

  private _racism5: RegExp;

  private _accents: RegExp;

  private _punctuation: RegExp;

  private _nonEnglish: RegExp;

  private _slurs: RegExp;

  private _slurs2: RegExp;

  private _slurs3: RegExp;

  private _slurs4: RegExp;

  private _slurs5: RegExp;

  private _slurs6: RegExp;

  private _racism6: RegExp;

  private _tos8: RegExp;

  private _tos9: RegExp;

  private _tos10: RegExp;

  private _login: RegExp;

  private _tos: RegExp;

  private _tos2: RegExp;

  private _tos3: RegExp;

  private _tos4: RegExp;

  private _tos5: RegExp;

  private _tos6: RegExp;

  private _tos7: RegExp;

  private _gptExtras: RegExp;

  private _url: RegExp;

  private _abelism: RegExp;

  private _advertising: RegExp;

  private _sellerbot: RegExp;

  private _twitchEmote1: RegExp;

  private _twitchEmote2: RegExp;

  private _twitchEmote3: RegExp;

  private _twitchEmoteID: RegExp;

  private _regexSymbolWithCombiningMarks: RegExp;

  private _regexLineBreakCombiningMarks: RegExp;

  /* eslint-disable camelcase */
  /* eslint-disable no-control-regex */
  /* eslint-disable prefer-regex-literals */
  /* eslint-disable no-misleading-character-class */
  private constructor() {
    if (CreateRegex.instance) {
      throw new Error(
        "You may not instantiate singleton more than once, use .new()"
      );
    }

    this.alphabetMap = new Map<string, string[]>();

    this.confusablesMap = new Map<string, string>();

    for (const [base, alts] of this.confusables.entries()) {
      this.alphabetMap.set(base, [...alts]);

      for (const char of alts) {
        this.confusablesMap.set(char, base);
      }
    }
  }

  public static new(): CreateRegex {
    return this.instance ?? (this.instance = new this());
  }

  public direct_ping = /\W?ryanpotat\W?/i;

  public get emojis() {
    if (this._emojis) {
      this._emojis.lastIndex = 0;
      return this._emojis;
    }

    this._emojis = new RegExp(
      /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/,
      "g"
    );

    return this._emojis;
  }

  public get indirect_pings() {
    if (this._indirect_pings) {
      this._indirect_pings.lastIndex = 0;
      return this._indirect_pings;
    }

    this._indirect_pings = new RegExp(
      /(?<!private\s)(?<![b+:.\-,;`=`])ryan(?:bob|poo?|u|\b(?:n{1,4}))?\b(?![+\-:\-;`=`])(?! (?:renolds|g(?:h)?osl(?:ing|l?ing)\b|higa|garcia|reynolds|lewis|kate|private|magee|\bair(?:lines?|\b)))|(?<![+:.\-,;`=`])\bpotat\b(?![+\-:.\-,;`=`])/,
      "g"
    );

    return this._indirect_pings;
  }

  public get invisChars() {
    if (this._invisChars) {
      this._invisChars.lastIndex = 0;
      return this._invisChars;
    }

    this._invisChars = new RegExp(
      "[\u034f\u2800\u{E0000}\u000E\u2000\u180e\ufeff\u2000-\u200d\u206D]",
      "gu"
    );

    return this._invisChars;
  }

  /** General racism */
  public get racism() {
    if (this._racism) {
      this._racism.lastIndex = 0;
      return this._racism;
    }

    this._racism = new RegExp(
      /((?:(?:\b(?<![-=])|monka)(?:[Nnñ]|[Ii7]V)|[|]\\[|])[\s]*?[liI1y!j|]+[\s]*?(?:[GgbB6934Q🅱qğĜƃ၅5][\s]*?){2,}(?!arcS|l|Ktlw|ylul|ie217|64|\d? ?times))|(\b((?=[nhk])(n[i1!¡jl]b+[e3]r|nygg[e3]r|higger|kneeger)[s5z]?)\b)|((chinam[ae]n|ching[\W_]*chong))|((towel|rag|diaper)[\W_]*head[s5z]?)|((sheep|goat|donkey)\W?(fuck|shag)\w*)|((sand|dune)[\W_]*(n[i1!¡jl]g(?!ht)|c[o0]{2}n|monk[iey]+)\w*)/,
      "gimu"
    );

    return this._racism;
  }

  /** Antisemitism */
  public get racism2() {
    if (this._racism2) {
      this._racism2.lastIndex = 0;
      return this._racism2;
    }

    this._racism2 = new RegExp(
      /((?=(the h[o0]l[o0]caust|gen[o0]cide|there was))(?<!saying )(?<!say )(?<!that )((the holocaust|genocide) ((didn[ ''‘’´`]?t|never) happened|(is|was) a lie)|There was( no|n[ ''‘’´`]?t an?y?)( \w+)? (genocide|holocaust)))(in[\W_]*bred[s5z]?)|filthy jew|(bl[a4]cks?|africans?) bastard|musl[i1]ms are (violent )?t[e3]rrorists?|r[e3]t[a4]rded m[0o]nkey|(bl[a4]cks?|africans?) (are|can be|were) (subhuman|primitive)|blackface/,
      "gimu"
    );

    return this._racism2;
  }

  /** Raccoon, without the rac, do you get it? */
  public get racism3() {
    if (this._racism3) {
      this._racism3.lastIndex = 0;
      return this._racism5;
    }

    this._racism3 = new RegExp(
      /\b[cĆćĈĉČčĊċÇçḈḉȻȼꞒꞓꟄꞔƇƈɕ]+\b[ÓóÒòŎŏÔôỐốỒồỖỗỔổǑǒÖöȪȫŐőÕõṌṍṎṏȬȭȮȯO͘o͘ȰȱØøǾǿǪǫǬǭŌōṒṓṐṑỎỏȌȍȎȏƠơỚớỜờỠỡỞởỢợỌọỘộO̩o̩Ò̩ò̩Ó̩ó̩ƟɵꝊꝋꝌꝍⱺＯｏ0]{2,}\b[nŃńǸǹŇňÑñṄṅŅņṆṇṊṋṈṉN̈n̈ƝɲŊŋꞐꞑꞤꞥᵰᶇɳȵꬻꬼИиПпＮｎ]+\b[sŚśṤṥŜŝŠšṦṧṠṡŞşṢṣṨṩȘșS̩s̩ꞨꞩⱾȿꟅʂᶊᵴ]*/,
      "gimu"
    );

    return this._racism3;
  }

  public get racism5() {
    if (this._racism5) {
      this._racism5.lastIndex = 0;
      return this._racism5;
    }

    this._racism5 = new RegExp(/[Nnñ][i1|][GgbB6934Q🅱qğĜƃ၅5][e3]r|nigga/, "gi");

    return this._racism5;
  }

  /** Portuguese racism */
  public get racism6() {
    if (this._racism6) {
      this._racism6.lastIndex = 0;
      return this._racism6;
    }

    this._racism6 = new RegExp(
      /\b(macaco|macaca|preto|preta|negr[oa]|neguinho|neguinha|neg[ao]? de merda|crioulo|crioula|mulata|mulato|japonesa|japones|japa|chin[eê]s|chin[eê]sa|amarelo|amarela|índio|índia|caboclo|cabocla|judeu|judia|muçulmano|muçulmana|árabe|arabe|palestino|palestina|racista|nazista|fascista|superior|inferior|subumano|primitivo)\b/,
      "gimu"
    );

    return this._racism6;
  }

  public get accents() {
    if (this._accents) {
      this._accents.lastIndex = 0;
      return this._accents;
    }

    this._accents = new RegExp(/[\u0300-\u036f\u00a0-\uffff]/, "g");

    return this._accents;
  }

  public get punctuation() {
    if (this._punctuation) {
      this._punctuation.lastIndex = 0;
      return this._punctuation;
    }

    this._punctuation = new RegExp(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/, "g");

    return this._punctuation;
  }

  public get nonEnglish() {
    if (this._nonEnglish) {
      this._nonEnglish.lastIndex = 0;
      return this._nonEnglish;
    }

    this._nonEnglish = new RegExp(/[^ -~\u0080-\uFFFF]+/, "gu");

    return this._nonEnglish;
  }

  /** General slurs */
  public get slurs() {
    if (this._slurs) {
      this._slurs.lastIndex = 0;
      return this._slurs;
    }

    this._slurs = new RegExp(
      /((f|ph)[áàâäãåa@][g4]+[e3o0]*t*\b)|((?=T)(tr[a@4]nn(y|[i¡1!jl]es?|er)|trans(v[eai]st[iy]te|fag|mental)|trapsexual)|she\W?males?)[s5z]?|(bull)?(?=d[yi]ke)(?<!Van\W(?=Dyke\b))d[yi]ke[s5z]?|(?=\w{7})\w+?f([a@4]|e(?=gg))[gq69]+([o0]|(?<=[ae]gg)i|e(?<=mcfagge))t[s5z]?|(fudge\W?packer|muff\W?diver|(carpet|rug)\W?muncher|pillow\W?biter|shirt\W?lifter|shit\W?stabber|turd\W?burglar)|boiola|tranny|women are nothing more than objects|women are objects|holocaust|playo|\b[fḞḟ][a4@][g]\b|[fḞḟ]+[a4@]+[g]+[o0]+[t]+/,
      "gim"
    );

    return this._slurs;
  }

  /** Misc slurs in other languages */
  public get slurs2() {
    if (this._slurs2) {
      this._slurs2.lastIndex = 0;
      return this._slurs2;
    }

    this._slurs2 = new RegExp(
      /amerykaniec|\bangol\b|arabus|asfalt|bambus|brudas|brudaska|Brytol|chachoł|chinol|ciapaty|czarnuch|fryc|gudłaj|helmut|japoniec|kacap|kacapka|kitajec|koszerny|kozojebca|kudłacz|makaroniarz|małpa|Moskal|negatyw|parch|pejsaty|rezun|Rusek|Ruska|skośnooki|syfiara|syfiarz|szkop|szmatogłowy|szuwaks|szwab|szwabka|\bturas\b|wietnamiec|żabojad|żółtek|żydek|Żydzisko|zabojad|zoltek|zydek|zydzisko|matoglowy|chachol|szuwak|\btura\b/,
      "gim"
    );

    return this._slurs2;
  }

  /** C-word (chinese discrimination) */
  public get slurs3() {
    if (this._slurs3) {
      this._slurs3.lastIndex = 0;
      return this._slurs3;
    }

    this._slurs3 = new RegExp(
      /[cĆćĈĉČčĊċÇçḈḉȻȼꞒꞓꟄꞔƇƈɕ]+[hĤĥȞȟḦḧḢḣḨḩḤḥḪḫH̱ẖĦħⱧⱨꞪɦꞕΗНн]+[[iÍíi̇́Ììi̇̀ĬĭÎîǏǐÏïḮḯĨĩi̇̃ĮįĮ́į̇́Į̃į̇̃ĪīĪ̀ī̀ỈỉȈȉI̋i̋ȊȋỊịꞼꞽḬḭƗɨᶖİiIıＩｉ1lĺľļḷḹl̃ḽḻłŀƚꝉⱡɫɬꞎꬷꬸꬹᶅɭȴＬｌ]+[nŃńǸǹŇňÑñṄṅŅņṆṇṊṋṈṉN̈n̈ƝɲŊŋꞐꞑꞤꞥᵰᶇɳȵꬻꬼИиПпＮｎ]+[kḰḱǨǩĶķḲḳḴḵƘƙⱩⱪᶄꝀꝁꝂꝃꝄꝅꞢꞣ]+[sŚśṤṥŜŝŠšṦṧṠṡŞşṢṣṨṩȘșS̩s̩ꞨꞩⱾȿꟅʂᶊᵴ]*/,
      "gim"
    );

    return this._slurs3;
  }

  /** T-word (transexual discrimination) */
  public get slurs4() {
    if (this._slurs4) {
      this._slurs4.lastIndex = 0;
      return this._slurs4;
    }

    this._slurs4 = new RegExp(
      /[tŤťṪṫŢţṬṭȚțṰṱṮṯŦŧȾⱦƬƭƮʈT̈ẗᵵƫȶ]+[rŔŕŘřṘṙŖŗȐȑȒȓṚṛṜṝṞṟR̃r̃ɌɍꞦꞧⱤɽᵲᶉꭉ]+[aÁáÀàĂăẮắẰằẴẵẲẳÂâẤấẦầẪẫẨẩǍǎÅåǺǻÄäǞǟÃãȦȧǠǡĄąĄ́ą́Ą̃ą̃ĀāĀ̀ā̀ẢảȀȁA̋a̋ȂȃẠạẶặẬậḀḁȺⱥꞺꞻᶏẚＡａ4]+[nŃńǸǹŇňÑñṄṅŅņṆṇṊṋṈṉN̈n̈ƝɲŊŋꞐꞑꞤꞥᵰᶇɳȵꬻꬼИиПпＮｎ]+([iÍíi̇́Ììi̇̀ĬĭÎîǏǐÏïḮḯĨĩi̇̃ĮįĮ́į̇́Į̃į̇̃ĪīĪ̀ī̀ỈỉȈȉI̋i̋ȊȋỊịꞼꞽḬḭƗɨᶖİiIıＩｉ1lĺľļḷḹl̃ḽḻłŀƚꝉⱡɫɬꞎꬷꬸꬹᶅɭȴＬｌ]+[e3ЄєЕеÉéÈèĔĕÊêẾếỀềỄễỂểÊ̄ê̄Ê̌ê̌ĚěËëẼẽĖėĖ́ė́Ė̃ė̃ȨȩḜḝĘęĘ́ę́Ę̃ę̃ĒēḖḗḔḕẺẻȄȅE̋e̋ȆȇẸẹỆệḘḙḚḛɆɇE̩e̩È̩è̩É̩é̩ᶒⱸꬴꬳＥｅ]+|[yÝýỲỳŶŷY̊ẙŸÿỸỹẎẏȲȳỶỷỴỵɎɏƳƴỾỿ]+|[e3ЄєЕеÉéÈèĔĕÊêẾếỀềỄễỂểÊ̄ê̄Ê̌ê̌ĚěËëẼẽĖėĖ́ė́Ė̃ė̃ȨȩḜḝĘęĘ́ę́Ę̃ę̃ĒēḖḗḔḕẺẻȄȅE̋e̋ȆȇẸẹỆệḘḙḚḛɆɇE̩e̩È̩è̩É̩é̩ᶒⱸꬴꬳＥｅ]+[rŔŕŘřṘṙŖŗȐȑȒȓṚṛṜṝṞṟR̃r̃ɌɍꞦꞧⱤɽᵲᶉꭉ]+)[sŚśṤṥŜŝŠšṦṧṠṡŞşṢṣṨṩȘșS̩s̩ꞨꞩⱾȿꟅʂᶊᵴ]*/,
      "gim"
    );

    return this._slurs4;
  }

  /** F-word */
  public get slurs5() {
    if (this._slurs5) {
      this._slurs5.lastIndex = 0;
      return this._slurs5;
    }

    this._slurs5 = new RegExp(
      /[fḞḟƑƒꞘꞙᵮᶂ]+[aÁáÀàĂăẮắẰằẴẵẲẳÂâẤấẦầẪẫẨẩǍǎÅåǺǻÄäǞǟÃãȦȧǠǡĄąĄ́ą́Ą̃ą̃ĀāĀ̀ā̀ẢảȀȁA̋a̋ȂȃẠạẶặẬậḀḁȺⱥꞺꞻᶏẚＡａ4@]+[gǴǵĞğĜĝǦǧĠġG̃g̃ĢģḠḡǤǥꞠꞡƓɠᶃꬶＧｇqꝖꝗꝘꝙɋʠ]+([ÓóÒòŎŏÔôỐốỒồỖỗỔổǑǒÖöȪȫŐőÕõṌṍṎṏȬȭȮȯO͘o͘ȰȱØøǾǿǪǫǬǭŌōṒṓṐṑỎỏȌȍȎȏƠơỚớỜờỠỡỞởỢợỌọỘộO̩o̩Ò̩ò̩Ó̩ó̩ƟɵꝊꝋꝌꝍⱺＯｏ0e3ЄєЕеÉéÈèĔĕÊêẾếỀềỄễỂểÊ̄ê̄Ê̌ê̌ĚěËëẼẽĖėĖ́ė́Ė̃ė̃ȨȩḜḝĘęĘ́ę́Ę̃ę̃ĒēḖḗḔḕẺẻȄȅE̋e̋ȆȇẸẹỆệḘḙḚḛɆɇE̩e̩È̩è̩É̩é̩ᶒⱸꬴꬳＥｅiÍíi̇́Ììi̇̀ĬĭÎîǏǐÏïḮḯĨĩi̇̃ĮįĮ́į̇́Į̃į̇̃ĪīĪ̀ī̀ỈỉȈȉI̋i̋ȊȋỊịꞼꞽḬḭƗɨᶖİiIıＩｉ1lĺľļḷḹl̃ḽḻłŀƚꝉⱡɫɬꞎꬷꬸꬹᶅɭȴＬｌ]+[tŤťṪṫŢţṬṭȚțṰṱṮṯŦŧȾⱦƬƭƮʈT̈ẗᵵƫȶ]+([rŔŕŘřṘṙŖŗȐȑȒȓṚṛṜṝṞṟR̃r̃ɌɍꞦꞧⱤɽᵲᶉꭉ]+[yÝýỲỳŶŷY̊ẙŸÿỸỹẎẏȲȳỶỷỴỵɎɏƳƴỾỿ]+|[rŔŕŘřṘṙŖŗȐȑȒȓṚṛṜṝṞṟR̃r̃ɌɍꞦꞧⱤɽᵲᶉꭉ]+[iÍíi̇́Ììi̇̀ĬĭÎîǏǐÏïḮḯĨĩi̇̃ĮįĮ́į̇́Į̃į̇̃ĪīĪ̀ī̀ỈỉȈȉI̋i̋ȊȋỊịꞼꞽḬḭƗɨᶖİiIıＩｉ1lĺľļḷḹl̃ḽḻłŀƚꝉⱡɫɬꞎꬷꬸꬹᶅɭȴＬｌ]+[e3ЄєЕеÉéÈèĔĕÊêẾếỀềỄễỂểÊ̄ê̄Ê̌ê̌ĚěËëẼẽĖėĖ́ė́Ė̃ė̃ȨȩḜḝĘęĘ́ę́Ę̃ę̃ĒēḖḗḔḕẺẻȄȅE̋e̋ȆȇẸẹỆệḘḙḚḛɆɇE̩e̩È̩è̩É̩é̩ᶒⱸꬴꬳＥｅ]+)?)?[sŚśṤṥŜŝŠšṦṧṠṡŞşṢṣṨṩȘșS̩s̩ꞨꞩⱾȿꟅʂᶊᵴ]*/,
      "gim"
    );

    return this._slurs5;
  }

  /** Portuguese slurs */
  public get slurs6() {
    if (this._slurs6) {
      this._slurs6.lastIndex = 0;
      return this._slurs6;
    }

    this._slurs6 = new RegExp(
      /\b(bicha|bichona|viado|veado|traveco|traveca|puta|putinha|vagabunda|vagabundo|macaco|preto|negr[oa]|neguinho|neguinha|crioulo|mulata|mulato|japonesa|japones|chin[eê]s|gordo|gorda|feio|feia|retardado|retardada|idiota|imbecil|burro|burra|pau no cu|puto|corn[oa]|chifrudo|chifruda|sapat[ao]|bixa|boiola|sapatona)\b/,
      "gim"
    );

    return this._slurs6;
  }

  public get login() {
    if (this._login) return this._login;

    this._login = /^[A-Z_\d]{3,25}$/i;

    return this._login;
  }

  /** Threats of violence */
  public get tos() {
    if (this._tos) {
      this._tos.lastIndex = 0;
      return this._tos;
    }

    this._tos = new RegExp(
      /\b(h[i1!¡jl]tl[e3]r|kms|kys|simp|incel)\b|i[''‘’´`]?(ll| will|( a)?m(m?a| go(ing to|nna))?| wan(t to|na))( \S+)? (k([i1!jl.\-_]{3}|\\?[^a-z\d\s]ll)|shoot|murder|hang|lynch|poison) ((y+[o0ua]+|u+))(r( \S+)? family)?|(?<!\w )cut (y([o0u]+r|o)|ur)\W?sel(f|ves)(?! \w)|should(a|\W?ve| have)* ((k[i1!jl.\-_](ll|lled)|hanged|hung|shot|shoot|exterminated|suicided|roped(?! \w+(\Wsel\w+)? (into|off|from))|drowned|necked) (y([o0u]+r|o)|ur|the[my]|dem)\W?sel(f|ves)|aborted (y([o0ua]+r?|o)|ur?))|((?=go)(?<!gonna )(?<!going to )(?<!n[o\W]t )go (die|jump (off|out|from)))|(?=should ?n[o''‘’´`]?t)(?<!I )should ?n[o''‘’´`]?t (be|stay) alive|\br[a4@]p[il1]st\b|\br[a4]p[e3]\b/,
      "gim"
    );

    return this._tos;
  }

  /** Threats of self harm */
  public get tos2() {
    if (this._tos2) {
      this._tos2.lastIndex = 0;
      return this._tos2;
    }

    this._tos2 = new RegExp(
      /(?=drink)(?<!t )drink (poison|bleach)|(?=slit)(?<!t (have|need) to )slit (y([o0u]+r|o)|ur)|r[a4@]p[e3]\W?(toy|meat|doll|slut|bait|slave|material|[s5$z](l|[^\w\s])([uv]|[^\w\s])[t7]|wh([o0]|[^\w\s])((r|[^\w\s])[e3]|[o0][a@4e3])|hole|face|body|pig)[s5z]?|(?=com+it|end|take)(?<!(n[o\W]t|you) )(?<!\bto )(com+it suicide|(?<!I will )(?<!want to )(?<!wanna )com+it die|(?<!could )(?<!likely )end your( own)? life(?! in\b)|take your( own)? life)|p[e3]d[o0]ph[i1]l[e3]|p[e0]d[o0]|eat (a|my) (dick|cock|penis)|sieg heil|heil hitler/,
      "gim"
    );

    return this._tos2;
  }

  /** Sexual harrasment */
  public get tos3() {
    if (this._tos3) {
      this._tos3.lastIndex = 0;
      return this._tos3;
    }

    this._tos3 = new RegExp(
      /pull the [^\s.]+( dam\w*| fuck\S+)? trigger(?! on(?! (yo)?ur\W?self))|blows? (\w+\W+(?<!\.)){1,4}(?<!my )(?<!own )brains? out|(?=play)(?<!to )(?<!n[o\W]t )play in (some )?traffic|(get|be) raped(?! with| on\b)(?<!can be raped)(?<!meant to be raped)|\br[a4@]p([e3][sd]?\b|[i1!¡jl]ng) (her|hi[ms]|the[my]|dem)|throats? (cut|ripped|slit)|pedo|pedobear|(lick|eat|suck|gobble) (my|your|his|her|their|our) (cock|dick|balls|cum|kok|coc)|^get (cancer|a( \w+)? tumor|AIDS|HIV|covid\w*|coronavirus|sick)|\b(suck|lick|gobble|consume|eat)\b.*?\b(my|these)\b.*?\b(cock|penis|dick|balls|nuts)|((show|flash|expose) (you|your|those|them) (tits|boobs|breasts|ass|cock|pussy|vagina|crotch))\b/,
      "gim"
    );

    return this._tos3;
  }

  /** Catch possiblity of bot saying it's underage */
  public get tos4() {
    if (this._tos4) {
      this._tos4.lastIndex = 0;
      return this._tos4;
    }

    this._tos4 = new RegExp(
      /\b(?:(?:i|my age)\s*['’]?\s*(?:am|'m|m| is|will be)\s*(?:(under|below)\s*)?(?:less\s*than\s*)?\s+(1[0-4]|[5-9]|(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen)))/,
      "gim"
    );

    return this._tos4;
  }

  public get tos5() {
    if (this._tos5) {
      this._tos5.lastIndex = 0;
      return this._tos5;
    }

    this._tos5 = new RegExp(
      /(\b(stick|shove|insert|force|put)\b.*?\b(in (my|their|h[eris]{2}|your))\b.*?\b(ass|butt|vagina|asshole|cunt)\b)|(\b([1li][0o][il][il]s?|[1li][0o]l[il]cons?)\b)/,
      "gi"
    );

    return this._tos5;
  }

  /** More self harm harrasment */
  public get tos6() {
    if (this._tos6) {
      this._tos6.lastIndex = 0;
      return this._tos6;
    }

    this._tos6 = new RegExp(
      /((k[i1]l+|[e3]nd|sh[0oO]+t)\s?(y[0oO]ur?)\s?(s[e3]l+f)?)/,
      "gi"
    );

    return this._tos6;
  }

  /**
   * Sexism
   */
  public get tos7() {
    if (this._tos7) {
      this._tos7.lastIndex = 0;
      return this._tos7;
    }

    this._tos7 = new RegExp(
      /\bwom[e3]n\s*(belong|should|go)\s*(in|2|go|be|to)?\s*(the\s*)?(k[i1]tch[e3]n|c[0o]{2}k|cl[e3]an)(ing)?\b/,
      "gi"
    );

    return this._tos7;
  }

  /** Portuguese threats of violence */
  public get tos8() {
    if (this._tos8) {
      this._tos8.lastIndex = 0;
      return this._tos8;
    }

    this._tos8 = new RegExp(
      /\b(v[ao]i? (se )?matar|mata|mate|assassinar|assassino|matar|morrer|morra|enforcar|enforque|enforcado|atirar|atire|atira|esfaquear|esfaque|esfaqueou|degolar|degole|linchar|lincha|envenenar|envenene|cortar|cor[te]|suicid[aeio]|suicide|mort[eo]|morrer|morra|deveria morrer|devia morrer|merece morrer|merece morr[ae]|devia estar morto|deveria estar morto)\b/,
      "gim"
    );

    return this._tos8;
  }

  /** Portuguese threats of self-harm */
  public get tos9() {
    if (this._tos9) {
      this._tos9.lastIndex = 0;
      return this._tos9;
    }

    this._tos9 = new RegExp(
      /\b(v[ao]i? (se )?matar|mata (você mesmo|teu pai|tua mãe|você mesmo)|se mata|se mate|comete suic[íi]dio|cometer suic[íi]dio|acabar com (sua|a sua|a) vida|tirar (sua|a sua|a) vida|acabar com a própria vida|tirar a própria vida|beb[ae]r (veneno|água sanitária)|beber (veneno|água sanitária)|cortar (o|os) pulsos|se cortar|se corta)\b/,
      "gim"
    );

    return this._tos9;
  }

  /** Portuguese sexual harassment */
  public get tos10() {
    if (this._tos10) {
      this._tos10.lastIndex = 0;
      return this._tos10;
    }

    this._tos10 = new RegExp(
      /\b((chupa|chupar|suga|sugar|mama|mamar|lambe|lamber|come|comer|fode|foder|transa|transar|trepa|trepar) (meu|minha|teu|tua|seu|sua|aquela|aquele|esse|essa) (p[ée]n[ei]s|pau|pica|pinto|rola|buceta|bct|vagina|xoxota|peito|peitos|seios|bunda|bunda|cu|buraco|an[au]s)|(mostra|mostrar|mostre|expor|exiba|exiba) (sua|teu|teu|seus|suas|aqueles|aquelas|esses|essas) (peito|peitos|seios|bunda|bunda|cu|p[ée]n[ei]s|pau|buceta|vagina|xoxota|pica|pinto|rola)|ped[óo]filo|pedofilo|ped[óo]b[éea]ar|pedobear|(estupr[ao]|estupre|estuprar|estupro|viol[ea]r|viol[eê]ncia sexual))\b/,
      "gim"
    );

    return this._tos10;
  }

  public get gptExtras() {
    if (this._gptExtras) {
      this._gptExtras.lastIndex = 0;
      return this._gptExtras;
    }

    this._gptExtras = new RegExp(
      /h[a4]t[3e]s? wom[ae3]n|w[0o]m[ae3]n h[a4]t[e3]r/,
      "gi"
    );

    return this._gptExtras;
  }

  public get url() {
    if (this._url) {
      this._url.lastIndex = 0;
      return this._url;
    }

    this._url = new RegExp(
      /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:~+#-]*[\w@?^=%&~+#-])/,
      "g"
    );

    return this._url;
  }

  /** Ableism discrimination */
  public get ableism() {
    if (this._abelism) {
      this._abelism.lastIndex = 0;
      return this._abelism;
    }

    this._abelism = new RegExp(
      /(?=\br)(?<!\b[a\Wi]m )r+[\W_]*[e3a4@i1!¡jlw]*[\W_]*[t7]+[\W_]*[a4@e3]*[\W_]*r+[\W_]*[dt]+[\W_]*([e3i1!¡jl]+[\W_]*[dt]+[\W_]*)?([s5z]|(?<=retarded)\w+|(?<!retard)ation)?|(th|d|(?=it\W*i?s(?! autism)))((is|at(?! autism)|(?<=th)[ts]|it)([ ''‘’´`]?i?s)?|ese|ose|em) autis(t(ic|ism)?|m)|retard|ass\W?burger/,
      "gim"
    );

    return this._abelism;
  }

  public get advertising() {
    if (this._advertising) {
      this._advertising.lastIndex = 0;
      return this._advertising;
    }

    this._advertising = new RegExp(
      /(?:[fḞḟƑƒꞘꞙᵮᶂ]+[ÓóÒòŎŏÔôỐꝌꝍⱺＯｏo0]+[lĺľļḷḹl̃ḽḻłŀƚꝉⱡɫɬꞎꬷꬸꬹᶅɭȴＬｌ]+[ÓóÒòŎŏÔôỐꝌꝍⱺＯｏo0]+[w]+[s]?|raid|host|w(a|4)tch|view|ch(e|3)ck|j(o|0)in|(?:go|come)\s?to)\s(?:o(?:ut|n))?\s?(?:m[ye]|us|him|her|them)\s(?:stream|channel|live|out\b)|(?:i'?m|we're|us|s?he'?s?|they'?re)\s?(?:live|streaming)|(f|f[o0][wl]|flw|[fḞḟƑƒꞘꞙᵮᶂ]+[ÓóÒòŎŏÔôỐꝌꝍⱺＯｏo0]+[lĺľļḷḹl̃ḽḻłŀƚꝉⱡɫɬꞎꬷꬸꬹᶅɭȴＬｌ]+[ÓóÒòŎŏÔôỐꝌꝍⱺＯｏo0]+[w]+[s]?)\s*(4|f(o|0)r)\s*(f|f[o0][wl]|flw|[fḞḟƑƒꞘꞙᵮᶂ]+[ÓóÒòŎŏÔôỐꝌꝍⱺＯｏo0]+[lĺľļḷḹl̃ḽḻłŀƚꝉⱡɫɬꞎꬷꬸꬹᶅɭȴＬｌ]+[ÓóÒòŎŏÔôỐꝌꝍⱺＯｏo0]+[w]+[s]?)|[fḞḟƑƒꞘꞙᵮᶂ]+[ÓóÒòŎŏÔôỐꝌꝍⱺＯｏo0]+[lĺľļḷḹl̃ḽḻłŀƚꝉⱡɫɬꞎꬷꬸꬹᶅɭȴＬｌ]+[ÓóÒòŎŏÔôỐꝌꝍⱺＯｏo0]+[w]+[s]? (me|them|us|him|her|b(4|a)ck)|f[0o]ll[0o]w[i1]ng ([e3]v[3e]ry(one|1)|anyone)?\s?(b[a4]ck)?/,
      "gim"
    );

    return this._advertising;
  }

  public get sellerbot() {
    if (this._sellerbot) {
      this._sellerbot.lastIndex = 0;
      return this._sellerbot;
    }

    this._sellerbot = new RegExp(
      /^(cheap viewers on)|(?:offer|promotion of your) channel|viewers|followers|views|chat bots /,
      "gim"
    );

    return this._sellerbot;
  }

  /** Twitch sub/bits/follower emotes. */
  public get twitchEmote1() {
    if (this._twitchEmote1) {
      this._twitchEmote1.lastIndex = 0;
      return this._twitchEmote1;
    }

    this._twitchEmote1 = new RegExp(
      /^[a-z]{3,10}[A-Z0-9][a-zA-Z0-9]{0,19}$/,
      "g"
    );

    return this._twitchEmote1;
  }

  /** Twitch Globals, hype train, etc. */
  public get twitchEmote2() {
    if (this._twitchEmote2) {
      this._twitchEmote2.lastIndex = 0;
      return this._twitchEmote2;
    }

    this._twitchEmote2 = new RegExp(/^(?=.*[A-Z])[a-zA-Z0-9]*$/, "g");

    return this._twitchEmote2;
  }

  /** Twitch smilies :), o_O, <3, etc. */
  public get twitchEmote3() {
    if (this._twitchEmote3) {
      this._twitchEmote3.lastIndex = 0;
      return this._twitchEmote3;
    }

    this._twitchEmote3 = new RegExp(/^[oOdDpPRZLl83|<>()-_:;./\\]{2,3}$/, "g");

    return this._twitchEmote3;
  }

  /** Twitch emote ids. */
  public get twitchEmoteID() {
    if (this._twitchEmoteID) {
      this._twitchEmoteID.lastIndex = 0;
      return this._twitchEmoteID;
    }

    this._twitchEmoteID = new RegExp(
      /^emotesv2_[a-z0-9]{32}$|^[0-9]{1,12}$/,
      "g"
    );

    return this._twitchEmoteID;
  }

  public get checkLNPRegex() {
    return /^(?:[~`!@#%^&*(){}[\];:"'<,.>?/\\|_+=-]|[a-zA-Z0-9\s])+$/;
  }

  public get regexSymbolWithCombiningMarks() {
    if (this._regexSymbolWithCombiningMarks) {
      this._regexSymbolWithCombiningMarks.lastIndex = 0;
      return this._regexSymbolWithCombiningMarks;
    }

    this._regexSymbolWithCombiningMarks = new RegExp(
      /([\0-\u02FF\u0370-\u1AAF\u1B00-\u1DBF\u1E00-\u20CF\u2100-\uD7FF\uE000-\uFE1F\uFE30-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])([\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]+)/,
      "g"
    );

    return this._regexSymbolWithCombiningMarks;
  }

  /** @copyright Mathias Bynens <https://mathiasbynens.be/>. MIT license. */
  public get regexLineBreakCombiningMarks() {
    if (this._regexLineBreakCombiningMarks) {
      this._regexLineBreakCombiningMarks.lastIndex = 0;
      return this._regexLineBreakCombiningMarks;
    }

    this._regexLineBreakCombiningMarks = new RegExp(
      /[\0-\x08\x0E-\x1F\x7F-\x84\x86-\x9F\u0300-\u034E\u0350-\u035B\u0363-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u061C\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D4-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D01-\u0D03\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F7E\u0F80-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF5\u1DFB-\u1DFF\u200C\u200E\u200F\u202A-\u202E\u2066-\u206F\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3035\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\uFFF9-\uFFFB]|\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD804[\uDC00-\uDC02\uDC38-\uDC46\uDC7F-\uDC82\uDCB0-\uDCBA\uDD00-\uDD02\uDD27-\uDD34\uDD73\uDD80-\uDD82\uDDB3-\uDDC0\uDDCA-\uDDCC\uDE2C-\uDE37\uDE3E\uDEDF-\uDEEA\uDF00-\uDF03\uDF3C\uDF3E-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF62\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC35-\uDC46\uDCB0-\uDCC3\uDDAF-\uDDB5\uDDB8-\uDDC0\uDDDC\uDDDD\uDE30-\uDE40\uDEAB-\uDEB7]|\uD807[\uDC2F-\uDC36\uDC38-\uDC3F\uDC92-\uDCA7\uDCA9-\uDCB6]|\uD81A[\uDEF0-\uDEF4\uDF30-\uDF36]|\uD81B[\uDF51-\uDF7E\uDF8F-\uDF92]|\uD82F[\uDC9D\uDC9E\uDCA0-\uDCA3]|\uD834[\uDD65-\uDD69\uDD6D-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDCD0-\uDCD6\uDD44-\uDD4A]|\uDB40[\uDC01\uDC20-\uDC7F\uDD00-\uDDEF]/,
      "g"
    );

    return this._regexLineBreakCombiningMarks;
  }

  private checkLNP(str: string) {
    return this.checkLNPRegex.test(str);
  }

  private clean(str: string) {
    return str
      .replace(this.regexLineBreakCombiningMarks, "")
      .replace(this.regexSymbolWithCombiningMarks, "$1")
      .replace(/[\u200B-\u200D\uFEFF\u2063]/g, "");
  }

  public replaceConfusables(str: string) {
    if (this.checkLNP(str)) return str;

    let newStr = "";

    for (const char of this.clean(str)) {
      newStr += this.confusablesMap.get(char) || char;
    }

    return newStr;
  }

  private normalizeUnicode(text: string): string {
    text = text.normalize("NFKD");

    for (const replacement of this.replacements) {
      text = text.replace(...replacement);
    }

    for (const [character, pattern] of this.specialCharacters) {
      text = text.replace(pattern, (match) =>
        match === match.toUpperCase() ? character : character.toLowerCase()
      );
    }

    return text;
  }

  public check(
    mainInput: string,
    arrayInput?: string | string[],
    channelID?: string
  ): boolean {
    if (!mainInput && !arrayInput) return false; // antes tinha só "return"

    const fullInput = mainInput + (arrayInput?.toString() ?? "");
    const cleansedText = fullInput.replace(this.invisChars, "").toLowerCase();
    const moreCleansedText = this.normalizeUnicode(cleansedText);
    const testString = this.replaceConfusables(moreCleansedText);

    const tests = [
      { name: "racism", check: () => this.racism.test(testString) },
      { name: "racism2", check: () => this.racism2.test(testString) },
      { name: "racism3", check: () => this.racism3.test(testString) },
      { name: "racism5", check: () => this.racism5.test(testString) },
      { name: "slurs", check: () => this.slurs.test(testString) },
      { name: "slurs2", check: () => this.slurs2.test(testString) },
      { name: "slurs3", check: () => this.slurs3.test(testString) },
      { name: "slurs4", check: () => this.slurs4.test(testString) },
      { name: "slurs5", check: () => this.slurs5.test(testString) },
      { name: "tos", check: () => this.tos.test(testString) },
      { name: "tos2", check: () => this.tos2.test(testString) },
      { name: "tos3", check: () => this.tos3.test(testString) },
      { name: "tos4", check: () => this.tos4.test(testString) },
      { name: "tos5", check: () => this.tos5.test(testString) },
      { name: "tos6", check: () => this.tos6.test(testString) },
      { name: "tos7", check: () => this.tos7.test(testString) },
      // Portuguese slurs
      { name: "slurs6", check: () => this.slurs6.test(testString) },
      // Portuguese racism
      { name: "racism6", check: () => this.racism6.test(testString) },
      // Portuguese threats of violence
      { name: "tos8", check: () => this.tos8.test(testString) },
      // Portuguese threats of self-harm
      { name: "tos9", check: () => this.tos9.test(testString) },
      // Portuguese sexual harassment
      { name: "tos10", check: () => this.tos10.test(testString) },
    ];

    /** @todo pass full regexp object, check first, the find matches if true for better logging */
    for (const { name, check } of tests) {
      if (check()) {
        const caughtPhrase = channelID
          ? `Found blacklisted content (Caught by: '${name}') in ${channelID}`
          : `Found blacklisted content (Caught by: '${name}')`;

        // Logger.warn(caughtPhrase, testString);
        console.log(caughtPhrase, testString);
        // pb.cord.misc(caughtPhrase, `Message: ${testString}`, '16744576');
        console.log(caughtPhrase, `Message: ${testString}`);
        return true;
      }
    }

    return false;
  }
}
