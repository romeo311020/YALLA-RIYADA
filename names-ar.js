// يلا رياضة — الأسماء العربية للفرق (المزوّد يرسلها بالإنجليزية).
// لإضافة فريق: أضف سطرًا في TEAMS بصيغة  'english name': 'الاسم العربي'  (حروف إنجليزية صغيرة بدون FC/CF/SC).
// أي فريق غير موجود هنا يظهر بالإنجليزية كما هو، وتجد قائمة الفرق غير المترجمة في Console المتصفح (F12).
(() => {
  'use strict';

  const TEAMS = {
    /* ===== الدوري الإنجليزي ===== */
    'arsenal': 'أرسنال', 'aston villa': 'أستون فيلا', 'bournemouth': 'بورنموث', 'brentford': 'برينتفورد', 'brighton': 'برايتون', 'brighton and hove albion': 'برايتون',
    'burnley': 'بيرنلي', 'chelsea': 'تشيلسي', 'crystal palace': 'كريستال بالاس', 'everton': 'إيفرتون', 'fulham': 'فولهام', 'leeds': 'ليدز', 'leeds united': 'ليدز يونايتد',
    'liverpool': 'ليفربول', 'manchester city': 'مانشستر سيتي', 'manchester united': 'مانشستر يونايتد', 'newcastle': 'نيوكاسل يونايتد', 'newcastle united': 'نيوكاسل يونايتد',
    'nottingham forest': 'نوتينغهام فورست', 'sunderland': 'سندرلاند', 'tottenham': 'توتنهام', 'tottenham hotspur': 'توتنهام', 'west ham': 'وست هام', 'west ham united': 'وست هام',
    'wolves': 'وولفرهامبتون', 'wolverhampton wanderers': 'وولفرهامبتون', 'leicester': 'ليستر سيتي', 'leicester city': 'ليستر سيتي', 'southampton': 'ساوثهامبتون', 'ipswich': 'إبسويتش تاون',
    'ipswich town': 'إبسويتش تاون', 'norwich': 'نورويتش سيتي', 'norwich city': 'نورويتش سيتي', 'middlesbrough': 'ميدلزبره', 'coventry': 'كوفنتري سيتي', 'coventry city': 'كوفنتري سيتي',
    'sheffield united': 'شيفيلد يونايتد', 'luton': 'لوتون تاون', 'luton town': 'لوتون تاون', 'watford': 'واتفورد', 'west bromwich albion': 'وست بروميتش', 'stoke city': 'ستوك سيتي',
    'birmingham': 'برمنغهام سيتي', 'birmingham city': 'برمنغهام سيتي', 'hull city': 'هال سيتي', 'blackburn': 'بلاكبيرن روفرز', 'derby county': 'ديربي كاونتي',

    /* ===== الدوري الإسباني ===== */
    'real madrid': 'ريال مدريد', 'barcelona': 'برشلونة', 'atletico madrid': 'أتلتيكو مدريد', 'sevilla': 'إشبيلية', 'valencia': 'فالنسيا', 'villarreal': 'فياريال',
    'real sociedad': 'ريال سوسيداد', 'athletic club': 'أتلتيك بلباو', 'athletic bilbao': 'أتلتيك بلباو', 'real betis': 'ريال بيتيس', 'betis': 'ريال بيتيس', 'celta vigo': 'سيلتا فيغو',
    'getafe': 'خيتافي', 'osasuna': 'أوساسونا', 'rayo vallecano': 'رايو فاليكانو', 'mallorca': 'ريال مايوركا', 'girona': 'جيرونا', 'alaves': 'ألافيس', 'espanyol': 'إسبانيول',
    'las palmas': 'لاس بالماس', 'levante': 'ليفانتي', 'elche': 'إلتشي', 'real oviedo': 'ريال أوفييدو', 'oviedo': 'ريال أوفييدو', 'real valladolid': 'ريال بلد الوليد', 'leganes': 'ليغانيس',
    'almeria': 'ألميريا', 'granada': 'غرناطة', 'cadiz': 'قادش',

    /* ===== الدوري المصري ===== */
    'al ahly': 'الأهلي', 'al ahly cairo': 'الأهلي', 'ahly': 'الأهلي', 'zamalek': 'الزمالك', 'pyramids': 'بيراميدز', 'al masry': 'المصري', 'masry': 'المصري', 'ismaily': 'الإسماعيلي',
    'future': 'فيوتشر', 'modern future': 'مودرن سبورت', 'modern sport': 'مودرن سبورت', 'ceramica cleopatra': 'سيراميكا كليوباترا', 'enppi': 'إنبي', 'pharco': 'فاركو', 'smouha': 'سموحة',
    'el gounah': 'الجونة', 'el gouna': 'الجونة', 'ghazl el mahalla': 'غزل المحلة', 'baladiyat el mahalla': 'بلدية المحلة', 'talaea el gaish': 'طلائع الجيش', 'tala a el gaish': 'طلائع الجيش',
    'petrojet': 'بتروجت', 'national bank of egypt': 'البنك الأهلي', 'national bank': 'البنك الأهلي', 'kahrabaa ismailia': 'كهرباء الإسماعيلية', 'zed': 'زد', 'haras el hodood': 'حرس الحدود',
    'el entag el harby': 'الإنتاج الحربي', 'al mokawloon al arab': 'المقاولون العرب', 'arab contractors': 'المقاولون العرب', 'telecom egypt': 'وي', 'we': 'وي', 'aswan': 'أسوان',
    'el dakhleya': 'الداخلية', 'ittihad alexandria': 'الاتحاد السكندري', 'al ittihad': 'الاتحاد', 'ala ab el tala a': 'طلائع الجيش', 'ceramica': 'سيراميكا كليوباترا',

    /* ===== أبطال أوروبا والدوري الأوروبي ===== */
    'bayern munich': 'بايرن ميونخ', 'bayern munchen': 'بايرن ميونخ', 'borussia dortmund': 'بوروسيا دورتموند', 'bayer leverkusen': 'باير ليفركوزن', 'rb leipzig': 'لايبزيغ', 'eintracht frankfurt': 'آينتراخت فرانكفورت',
    'vfb stuttgart': 'شتوتغارت', 'stuttgart': 'شتوتغارت', 'wolfsburg': 'فولفسبورغ', 'freiburg': 'فرايبورغ', 'hoffenheim': 'هوفنهايم', 'borussia monchengladbach': 'بوروسيا مونشنغلادباخ', 'werder bremen': 'فيردر بريمن', 'union berlin': 'أونيون برلين',
    'paris saint germain': 'باريس سان جيرمان', 'paris saint-germain': 'باريس سان جيرمان', 'psg': 'باريس سان جيرمان', 'marseille': 'مارسيليا', 'olympique marseille': 'مارسيليا', 'monaco': 'موناكو', 'lille': 'ليل', 'lyon': 'ليون', 'olympique lyonnais': 'ليون',
    'nice': 'نيس', 'lens': 'لانس', 'rennes': 'رين', 'strasbourg': 'ستراسبورغ', 'nantes': 'نانت', 'toulouse': 'تولوز', 'brest': 'بريست',
    'juventus': 'يوفنتوس', 'ac milan': 'ميلان', 'milan': 'ميلان', 'inter': 'إنتر ميلان', 'inter milan': 'إنتر ميلان', 'napoli': 'نابولي', 'roma': 'روما', 'as roma': 'روما', 'lazio': 'لاتسيو', 'atalanta': 'أتالانتا',
    'fiorentina': 'فيورنتينا', 'bologna': 'بولونيا', 'torino': 'تورينو', 'genoa': 'جنوة',
    'benfica': 'بنفيكا', 'porto': 'بورتو', 'sporting cp': 'سبورتينغ لشبونة', 'sporting': 'سبورتينغ لشبونة', 'braga': 'براغا', 'sc braga': 'براغا', 'vitoria guimaraes': 'فيتوريا غيمارايش',
    'ajax': 'أياكس', 'psv eindhoven': 'آيندهوفن', 'psv': 'آيندهوفن', 'feyenoord': 'فينورد', 'az alkmaar': 'ألكمار', 'twente': 'تفينتي', 'utrecht': 'أوترخت',
    'celtic': 'سلتيك', 'rangers': 'رينجرز', 'club brugge': 'كلوب بروج', 'anderlecht': 'أندرلخت', 'union saint gilloise': 'يونيون سان جيلواز', 'genk': 'خينك', 'gent': 'خنت',
    'galatasaray': 'غلطة سراي', 'fenerbahce': 'فنربخشة', 'besiktas': 'بشكتاش', 'trabzonspor': 'طرابزون سبور', 'basaksehir': 'باشاك شهير',
    'shakhtar donetsk': 'شاختار دونيتسك', 'dynamo kyiv': 'دينامو كييف', 'red bull salzburg': 'ريد بول سالزبورغ', 'salzburg': 'ريد بول سالزبورغ', 'sturm graz': 'شتورم غراتس', 'rapid wien': 'رابيد فيينا',
    'olympiacos': 'أولمبياكوس', 'panathinaikos': 'باناثينايكوس', 'paok': 'باوك', 'aek athens': 'إيه إي كيه أثينا', 'aris': 'أريس سالونيك',
    'copenhagen': 'كوبنهاغن', 'fc copenhagen': 'كوبنهاغن', 'midtjylland': 'ميتييلاند', 'brondby': 'برونبي', 'bodo glimt': 'بودو غليمت', 'molde': 'مولده', 'malmo': 'مالمو', 'malmo ff': 'مالمو', 'hammarby': 'هامماربي', 'djurgarden': 'يورغوردن',
    'young boys': 'يانغ بويز', 'basel': 'بازل', 'fc basel': 'بازل', 'servette': 'سيرفيت', 'lugano': 'لوغانو',
    'slavia praha': 'سلافيا براغ', 'slavia prague': 'سلافيا براغ', 'sparta praha': 'سبارتا براغ', 'sparta prague': 'سبارتا براغ', 'viktoria plzen': 'فيكتوريا بلزن',
    'dinamo zagreb': 'دينامو زغرب', 'gnk dinamo zagreb': 'دينامو زغرب', 'hajduk split': 'هايدوك سبليت', 'red star belgrade': 'النجم الأحمر', 'crvena zvezda': 'النجم الأحمر', 'partizan': 'بارتيزان',
    'qarabag': 'قره باغ', 'ferencvaros': 'فيرنسفاروش', 'ludogorets': 'لودوغوريتس', 'slovan bratislava': 'سلوفان براتيسلافا', 'lincoln red imps': 'لينكولن ريد إمبس',
    'maccabi tel aviv': 'مكابي تل أبيب', 'maccabi haifa': 'مكابي حيفا', 'bate borisov': 'باتي بوريسوف', 'ludogorets razgrad': 'لودوغوريتس', 'cluj': 'كلوج', 'fcsb': 'إف سي إس بي', 'steaua bucuresti': 'ستيوا بوخارست',
    'real madrid castilla': 'ريال مدريد (رديف)',

    /* ===== دوري أبطال أفريقيا والكونفدرالية ===== */
    'mamelodi sundowns': 'ماميلودي صن داونز', 'sundowns': 'ماميلودي صن داونز', 'orlando pirates': 'أورلاندو بايرتس', 'kaizer chiefs': 'كايزر تشيفز', 'stellenbosch': 'ستيلينبوش', 'ts galaxy': 'تي إس غالاكسي',
    'amazulu': 'أمازولو', 'supersport united': 'سوبر سبورت يونايتد', 'sekhukhune united': 'سيخوخوني يونايتد',
    'esperance de tunis': 'الترجي التونسي', 'esperance tunis': 'الترجي التونسي', 'es tunis': 'الترجي التونسي', 'etoile du sahel': 'النجم الساحلي', 'etoile sahel': 'النجم الساحلي', 'cs sfaxien': 'الصفاقسي', 'club africain': 'الإفريقي',
    'us monastir': 'الاتحاد المنستيري', 'cs hammam lif': 'حمام الأنف',
    'wydad casablanca': 'الوداد الرياضي', 'wydad ac': 'الوداد الرياضي', 'wydad': 'الوداد الرياضي', 'raja casablanca': 'الرجاء الرياضي', 'raja ca': 'الرجاء الرياضي', 'rs berkane': 'نهضة بركان', 'renaissance sportive de berkane': 'نهضة بركان',
    'as far': 'الجيش الملكي', 'far rabat': 'الجيش الملكي', 'ma tetouan': 'المغرب التطواني', 'maghreb fes': 'المغرب الفاسي', 'hassania agadir': 'حسنية أكادير', 'olympic safi': 'أولمبيك آسفي', 'olympique safi': 'أولمبيك آسفي',
    'usm alger': 'اتحاد الجزائر', 'cr belouizdad': 'شباب بلوزداد', 'mc alger': 'مولودية الجزائر', 'js kabylie': 'شبيبة القبائل', 'cs constantine': 'شباب قسنطينة', 'es setif': 'وفاق سطيف', 'paradou ac': 'بارادو',
    'tp mazembe': 'مازيمبي', 'mazembe': 'مازيمبي', 'as vita club': 'فيتا كلوب', 'vita club': 'فيتا كلوب', 'maniema union': 'مانييما يونيون', 'dcmp': 'دي سي إم بي',
    'al hilal omdurman': 'الهلال السوداني', 'al hilal': 'الهلال', 'al merrikh': 'المريخ السوداني', 'al merreikh': 'المريخ السوداني',
    'simba': 'سيمبا', 'simba sc': 'سيمبا', 'young africans': 'يانغ أفريكانز', 'yanga': 'يانغ أفريكانز', 'azam': 'أزام', 'horoya': 'حوريا', 'asec mimosas': 'أسيك ميموزا', 'enyimba': 'إنييمبا', 'rivers united': 'ريفرز يونايتد',
    'remo stars': 'ريمو ستارز', 'petro de luanda': 'بترو أتلتيكو', 'petro atletico': 'بترو أتلتيكو', 'zesco united': 'زيسكو يونايتد', 'power dynamos': 'باور دينامو', 'al ahli tripoli': 'الأهلي طرابلس', 'al ittihad tripoli': 'الاتحاد الليبي',
    'stade malien': 'ستاد مالي', 'djoliba': 'جولييبا', 'rayon sports': 'رايون سبورتس', 'apr': 'إيه بي آر', 'sagrada esperanca': 'ساغرادا إسبرانسا', 'al nasr benghazi': 'النصر بنغازي', 'otoho d oyo': 'أوتوهو',
    'diables noirs': 'الشياطين السود', 'as otoho': 'أوتوهو', 'cd lunda sul': 'لوندا سول', 'bechem united': 'بيتشيم يونايتد', 'gaborone united': 'غابورون يونايتد', 'black bulls': 'بلاك بولز', 'ud songo': 'سونغو', 'abu salim': 'أبو سليم',
    'la passe': 'لا باس', 'cr belouizdad algiers': 'شباب بلوزداد',


    'esperance sportive de tunis': 'الترجي التونسي', 'etoile sportive du sahel': 'النجم الساحلي', 'club sportif sfaxien': 'الصفاقسي', 'al ahly sc': 'الأهلي', 'zamalek sc': 'الزمالك', 'young africans sc': 'يانغ أفريكانز', 'wydad athletic club': 'الوداد الرياضي', 'raja club athletic': 'الرجاء الرياضي', 'tout puissant mazembe': 'مازيمبي', 'orlando pirates fc': 'أورلاندو بايرتس',
    /* ===== الدوري السعودي ===== */
    'al nassr': 'النصر', 'al hilal sfc': 'الهلال', 'al hilal saudi fc': 'الهلال', 'al ittihad jeddah': 'الاتحاد', 'al ittihad fc': 'الاتحاد', 'al ahli': 'الأهلي السعودي', 'al ahli jeddah': 'الأهلي السعودي', 'al ahli saudi fc': 'الأهلي السعودي',
    'al shabab': 'الشباب', 'al taawoun': 'التعاون', 'al fateh': 'الفتح', 'al fayha': 'الفيحاء', 'al ettifaq': 'الاتفاق', 'al raed': 'الرائد', 'al khaleej': 'الخليج', 'al riyadh': 'الرياض', 'damac': 'ضمك', 'al okhdood': 'الأخدود',
    'al qadsiah': 'القادسية', 'al kholood': 'الخلود', 'al orobah': 'العروبة', 'al wehda': 'الوحدة', 'al najma': 'النجمة', 'neom': 'نيوم', 'neom sc': 'نيوم', 'al hazem': 'الحزم', 'abha': 'أبها', 'al tai': 'الطائي', 'al akhdoud': 'الأخدود',
    'al jabalain': 'الجبلين', 'al batin': 'الباطن', 'al adalah': 'العدالة', 'al diriyah': 'الدرعية', 'al zulfi': 'الزلفي', 'al anwar': 'الأنوار',
    /* ===== الخليج ===== */
    'al ain': 'العين', 'al wahda': 'الوحدة الإماراتي', 'al wasl': 'الوصل', 'al jazira': 'الجزيرة', 'shabab al ahli': 'شباب الأهلي', 'sharjah': 'الشارقة', 'al nasr dubai': 'النصر الإماراتي', 'bani yas': 'بني ياس', 'al dhafra': 'الظفرة',
    'al sadd': 'السد', 'al duhail': 'الدحيل', 'al gharafa': 'الغرافة', 'al rayyan': 'الريان', 'al arabi': 'العربي', 'al wakrah': 'الوكرة', 'umm salal': 'أم صلال', 'al shamal': 'الشمال', 'qatar sc': 'قطر',
    'al kuwait': 'الكويت', 'al qadsia': 'القادسية الكويتي', 'al arabi kuwait': 'العربي الكويتي',
    /* ===== المغرب وتونس والجزائر (إضافات) ===== */
    'fus rabat': 'الفتح الرباطي', 'difaa el jadidi': 'الدفاع الحسني الجديدي', 'dhj': 'الدفاع الحسني الجديدي', 'ittihad tanger': 'اتحاد طنجة', 'irt tanger': 'اتحاد طنجة', 'mas fes': 'المغرب الفاسي', 'kawkab marrakech': 'الكوكب المراكشي', 'rapide oued zem': 'الرجاء بني ملال',
    'us ben guerdane': 'بن قردان', 'ca bizertin': 'النادي البنزرتي', 'stade tunisien': 'الستاد التونسي', 'es zarzis': 'الأولمبي الزرزيسي', 'us tataouine': 'اتحاد تطاوين', 'jse': 'جمعية جيجل',
    'jsm skikda': 'جمعية سكيكدة', 'mc oran': 'مولودية وهران', 'usm khenchela': 'اتحاد خنشلة', 'es mostaganem': 'وفاق مستغانم', 'us biskra': 'اتحاد بسكرة', 'nc magra': 'نادي مقرة', 'jsm tiaret': 'شباب تيارت', 'js saoura': 'شبيبة الساورة',
    /* ===== تركيا ===== */
    'konyaspor': 'قونيا سبور', 'alanyaspor': 'ألانيا سبور', 'antalyaspor': 'أنطاليا سبور', 'kasimpasa': 'قاسم باشا', 'sivasspor': 'سيفاس سبور', 'rizespor': 'ريزه سبور', 'caykur rizespor': 'ريزه سبور', 'gaziantep': 'غازي عنتاب', 'eyupspor': 'أيوب سبور',
    'samsunspor': 'سامسون سبور', 'kayserispor': 'قيصري سبور', 'goztepe': 'غوزتيبه', 'bodrum': 'بودرم', 'genclerbirligi': 'غنجلربيرليغي', 'istanbul basaksehir': 'باشاك شهير',
    /* ===== هولندا والبرتغال (إضافات) ===== */
    'nec nijmegen': 'نيميغن', 'go ahead eagles': 'غو أهد إيغلز', 'sc heerenveen': 'هيرينفين', 'fortuna sittard': 'فورتونا سيتارد', 'pec zwolle': 'زفولة', 'groningen': 'خرونينخن', 'sparta rotterdam': 'سبارتا روتردام', 'nac breda': 'بريدا',
    'estoril': 'إستوريل', 'famalicao': 'فاماليكاو', 'moreirense': 'موريرنسي', 'gil vicente': 'جيل فيسنتي', 'casa pia': 'كاسا بيا', 'rio ave': 'ريو آفي', 'arouca': 'أروكا', 'santa clara': 'سانتا كلارا', 'boavista': 'بوافيستا', 'farense': 'فارنسي', 'nacional': 'ناسيونال',
    /* ===== أمريكا ===== */
    'inter miami': 'إنتر ميامي', 'inter miami cf': 'إنتر ميامي', 'la galaxy': 'لوس أنجلوس غالاكسي', 'los angeles fc': 'لوس أنجلوس إف سي', 'lafc': 'لوس أنجلوس إف سي', 'new york city': 'نيويورك سيتي', 'new york red bulls': 'نيويورك ريد بولز', 'seattle sounders': 'سياتل ساوندرز',
    'atlanta united': 'أتلانتا يونايتد', 'columbus crew': 'كولومبوس كرو', 'fc cincinnati': 'سينسيناتي', 'philadelphia union': 'فيلادلفيا يونيون', 'orlando city': 'أورلاندو سيتي', 'portland timbers': 'بورتلاند تيمبرز', 'toronto': 'تورنتو', 'austin': 'أوستن', 'charlotte': 'شارلوت',
    'flamengo': 'فلامنغو', 'palmeiras': 'بالميراس', 'sao paulo': 'ساو باولو', 'corinthians': 'كورينثيانز', 'fluminense': 'فلومينينسي', 'botafogo': 'بوتافوغو', 'atletico mineiro': 'أتلتيكو مينيرو', 'gremio': 'غريميو', 'internacional': 'إنتر بورتو أليغري', 'santos': 'سانتوس', 'cruzeiro': 'كروزيرو', 'vasco da gama': 'فاسكو دا غاما', 'bahia': 'باهيا', 'fortaleza': 'فورتاليزا',
    'boca juniors': 'بوكا جونيورز', 'river plate': 'ريفر بليت', 'racing club': 'راسينغ كلوب', 'independiente': 'إندبندينتي', 'san lorenzo': 'سان لورينزو', 'estudiantes': 'إستوديانتس', 'velez sarsfield': 'فيليز سارسفيلد', 'talleres': 'تاليريس', 'lanus': 'لانوس',
    'penarol': 'بينارول', 'nacional montevideo': 'ناسيونال مونتيفيديو', 'colo colo': 'كولو كولو', 'universidad de chile': 'أونيفرسيداد تشيلي', 'liga de quito': 'ليغا دي كيتو', 'independiente del valle': 'إندبندينتي ديل بايي', 'olimpia': 'أوليمبيا', 'barcelona sc': 'برشلونة غواياكيل',
    /* ===== منتخبات ===== */
    'egypt': 'مصر', 'saudi arabia': 'السعودية', 'morocco': 'المغرب', 'tunisia': 'تونس', 'algeria': 'الجزائر', 'qatar': 'قطر', 'united arab emirates': 'الإمارات', 'iraq': 'العراق', 'jordan': 'الأردن', 'kuwait': 'الكويت', 'oman': 'عُمان', 'bahrain': 'البحرين', 'lebanon': 'لبنان', 'syria': 'سوريا', 'palestine': 'فلسطين', 'libya': 'ليبيا', 'sudan': 'السودان', 'yemen': 'اليمن', 'mauritania': 'موريتانيا',
    'senegal': 'السنغال', 'nigeria': 'نيجيريا', 'ivory coast': 'كوت ديفوار', 'cote d ivoire': 'كوت ديفوار', 'ghana': 'غانا', 'cameroon': 'الكاميرون', 'mali': 'مالي', 'south africa': 'جنوب أفريقيا', 'dr congo': 'الكونغو الديمقراطية', 'congo dr': 'الكونغو الديمقراطية', 'burkina faso': 'بوركينا فاسو', 'guinea': 'غينيا', 'cape verde': 'الرأس الأخضر', 'angola': 'أنغولا', 'zambia': 'زامبيا', 'tanzania': 'تنزانيا', 'uganda': 'أوغندا', 'kenya': 'كينيا', 'gabon': 'الغابون', 'benin': 'بنين', 'comoros': 'جزر القمر', 'mozambique': 'موزمبيق', 'zimbabwe': 'زيمبابوي', 'equatorial guinea': 'غينيا الاستوائية',
    'france': 'فرنسا', 'spain': 'إسبانيا', 'germany': 'ألمانيا', 'italy': 'إيطاليا', 'england': 'إنجلترا', 'portugal': 'البرتغال', 'netherlands': 'هولندا', 'belgium': 'بلجيكا', 'croatia': 'كرواتيا', 'switzerland': 'سويسرا', 'denmark': 'الدنمارك', 'sweden': 'السويد', 'norway': 'النرويج', 'poland': 'بولندا', 'austria': 'النمسا', 'czech republic': 'التشيك', 'serbia': 'صربيا', 'scotland': 'اسكتلندا', 'wales': 'ويلز', 'ireland': 'إيرلندا', 'northern ireland': 'أيرلندا الشمالية', 'ukraine': 'أوكرانيا', 'greece': 'اليونان', 'turkey': 'تركيا', 'hungary': 'المجر', 'romania': 'رومانيا', 'slovakia': 'سلوفاكيا', 'slovenia': 'سلوفينيا', 'albania': 'ألبانيا', 'finland': 'فنلندا', 'iceland': 'آيسلندا', 'russia': 'روسيا',
    'brazil': 'البرازيل', 'argentina': 'الأرجنتين', 'uruguay': 'الأوروغواي', 'colombia': 'كولومبيا', 'chile': 'تشيلي', 'ecuador': 'الإكوادور', 'paraguay': 'باراغواي', 'peru': 'بيرو', 'venezuela': 'فنزويلا', 'bolivia': 'بوليفيا', 'usa': 'الولايات المتحدة', 'united states': 'الولايات المتحدة', 'mexico': 'المكسيك', 'canada': 'كندا', 'costa rica': 'كوستاريكا', 'panama': 'بنما', 'jamaica': 'جامايكا',
    'japan': 'اليابان', 'south korea': 'كوريا الجنوبية', 'korea republic': 'كوريا الجنوبية', 'iran': 'إيران', 'australia': 'أستراليا', 'china': 'الصين', 'china pr': 'الصين', 'uzbekistan': 'أوزبكستان', 'india': 'الهند', 'indonesia': 'إندونيسيا', 'thailand': 'تايلاند', 'new zealand': 'نيوزيلندا',

    /* ===== كرة السلة: NBA ===== */
    'atlanta hawks': 'أتلانتا هوكس', 'boston celtics': 'بوسطن سلتيكس', 'brooklyn nets': 'بروكلين نتس', 'charlotte hornets': 'شارلوت هورنتس', 'chicago bulls': 'شيكاغو بولز',
    'cleveland cavaliers': 'كليفلاند كافالييرز', 'dallas mavericks': 'دالاس مافريكس', 'denver nuggets': 'دنفر ناجتس', 'detroit pistons': 'ديترويت بيستونز', 'golden state warriors': 'غولدن ستيت واريرز',
    'houston rockets': 'هيوستن روكتس', 'indiana pacers': 'إنديانا بيسرز', 'los angeles clippers': 'لوس أنجلوس كليبرز', 'la clippers': 'لوس أنجلوس كليبرز', 'los angeles lakers': 'لوس أنجلوس ليكرز',
    'memphis grizzlies': 'ممفيس غريزليز', 'miami heat': 'ميامي هيت', 'milwaukee bucks': 'ميلووكي باكس', 'minnesota timberwolves': 'مينيسوتا تمبروولفز', 'new orleans pelicans': 'نيو أورليانز بيليكانز',
    'new york knicks': 'نيويورك نيكس', 'oklahoma city thunder': 'أوكلاهوما سيتي ثاندر', 'orlando magic': 'أورلاندو ماجيك', 'philadelphia 76ers': 'فيلادلفيا سفنتي سيكسرز', 'phoenix suns': 'فينيكس صنز',
    'portland trail blazers': 'بورتلاند تريل بليزرز', 'sacramento kings': 'ساكرامنتو كينغز', 'san antonio spurs': 'سان أنطونيو سبيرز', 'toronto raptors': 'تورونتو رابتورز', 'utah jazz': 'يوتا جاز',
    'washington wizards': 'واشنطن ويزاردز',
    /* ===== كرة السلة: يوروليغ ===== */
    'anadolu efes': 'أناضولو إفيس', 'baskonia': 'باسكونيا', 'virtus bologna': 'فيرتوس بولونيا', 'olimpia milano': 'أولمبيا ميلانو', 'ea7 emporio armani milan': 'أولمبيا ميلانو', 'alba berlin': 'ألبا برلين',
    'fc bayern munich': 'بايرن ميونخ', 'zalgiris': 'زالغيريس', 'zalgiris kaunas': 'زالغيريس', 'paris basketball': 'باريس لكرة السلة', 'asvel': 'أسفيل', 'ldlc asvel': 'أسفيل', 'hapoel tel aviv': 'هابويل تل أبيب',
    'as monaco': 'موناكو', 'dubai basketball': 'دبي لكرة السلة', 'valencia basket': 'فالنسيا باسكت', 'partizan belgrade': 'بارتيزان', 'crvena zvezda meridianbet': 'النجم الأحمر',
  };


  /* ===== اللاعبون: بالاسم الكامل أو اللقب (يُطابق آخر كلمة من الاسم). أضف ما تشاء. ===== */
  const PLAYERS = {
    /* مصريون وعرب */
    'mohamed salah': 'محمد صلاح', 'salah': 'صلاح', 'mostafa mohamed': 'مصطفى محمد', 'omar marmoush': 'عمر مرموش', 'marmoush': 'مرموش', 'mohamed elneny': 'محمد النني', 'elneny': 'النني', 'trezeguet': 'تريزيغيه', 'mahmoud hassan trezeguet': 'تريزيغيه',
    'mohamed abdelmonem': 'محمد عبد المنعم', 'ahmed hegazi': 'أحمد حجازي', 'hegazi': 'حجازي', 'mohamed el shenawy': 'محمد الشناوي', 'el shenawy': 'الشناوي', 'mohamed abou gabal': 'محمد أبو جبل', 'zizo': 'زيزو', 'ahmed sayed zizo': 'زيزو', 'emam ashour': 'إمام عاشور', 'ashour': 'عاشور',
    'percy tau': 'بيرسي تاو', 'wessam abou ali': 'وسام أبو علي', 'abou ali': 'أبو علي', 'hussein el shahat': 'حسين الشحات', 'el shahat': 'الشحات', 'mahmoud kahraba': 'محمود كهربا', 'kahraba': 'كهربا', 'taher mohamed': 'طاهر محمد طاهر', 'yasser ibrahim': 'ياسر إبراهيم',
    'seifeddine jaziri': 'سيف الدين الجزيري', 'jaziri': 'الجزيري', 'hakim ziyech': 'حكيم زياش', 'ziyech': 'زياش', 'achraf hakimi': 'أشرف حكيمي', 'hakimi': 'حكيمي', 'yassine bounou': 'ياسين بونو', 'bounou': 'بونو', 'youssef en nesyri': 'يوسف النصيري', 'en nesyri': 'النصيري', 'sofyan amrabat': 'سفيان أمرابط', 'amrabat': 'أمرابط', 'noussair mazraoui': 'نصير مزراوي', 'mazraoui': 'مزراوي', 'brahim diaz': 'إبراهيم دياز',
    'riyad mahrez': 'رياض محرز', 'mahrez': 'محرز', 'ismael bennacer': 'إسماعيل بن ناصر', 'bennacer': 'بن ناصر', 'aissa mandi': 'عيسى ماندي', 'houssem aouar': 'حسام عوار', 'aouar': 'عوار', 'baghdad bounedjah': 'بغداد بونجاح', 'bounedjah': 'بونجاح', 'amine gouiri': 'أمين غويري',
    'salem al dawsari': 'سالم الدوسري', 'al dawsari': 'الدوسري', 'saud abdulhamid': 'سعود عبد الحميد', 'abdulhamid': 'عبد الحميد', 'mohammed al owais': 'محمد العويس', 'al owais': 'العويس', 'firas al buraikan': 'فراس البريكان', 'al buraikan': 'البريكان', 'yasser al shahrani': 'ياسر الشهراني', 'al shahrani': 'الشهراني',
    'akram afif': 'أكرم عفيف', 'afif': 'عفيف', 'almoez ali': 'المعز علي', 'hassan al haydos': 'حسن الهيدوس', 'al haydos': 'الهيدوس', 'mohammed muntari': 'محمد منتاري', 'muntari': 'منتاري', 'ali olwan': 'علي علوان', 'musa al tamari': 'موسى التعمري', 'al tamari': 'التعمري',
    'aymen hussein': 'أيمن حسين', 'sardar azmoun': 'سردار أزمون', 'azmoun': 'أزمون', 'mehdi taremi': 'مهدي طارمي', 'taremi': 'طارمي',
    /* مدربون */
    'pep guardiola': 'بيب غوارديولا', 'guardiola': 'غوارديولا', 'carlo ancelotti': 'كارلو أنشيلوتي', 'ancelotti': 'أنشيلوتي', 'xabi alonso': 'تشابي ألونسو', 'hansi flick': 'هانزي فليك', 'flick': 'فليك', 'arne slot': 'آرني سلوت', 'slot': 'سلوت', 'mikel arteta': 'ميكيل أرتيتا', 'arteta': 'أرتيتا',
    'jose mourinho': 'جوزيه مورينيو', 'mourinho': 'مورينيو', 'simone inzaghi': 'سيموني إنزاغي', 'inzaghi': 'إنزاغي', 'luis enrique': 'لويس إنريكي', 'diego simeone': 'دييغو سيميوني', 'simeone': 'سيميوني', 'jorge jesus': 'خورخي خيسوس', 'enzo maresca': 'إنزو ماريسكا', 'maresca': 'ماريسكا', 'ruben amorim': 'روبن أموريم', 'amorim': 'أموريم', 'thomas tuchel': 'توماس توخيل', 'tuchel': 'توخيل', 'ange postecoglou': 'أنجي بوستيكوغلو', 'unai emery': 'أوناي إيمري', 'emery': 'إيمري', 'massimiliano allegri': 'ماسيميليانو أليغري', 'allegri': 'أليغري', 'antonio conte': 'أنطونيو كونتي', 'conte': 'كونتي', 'gian piero gasperini': 'جاسبريني', 'gasperini': 'جاسبريني', 'hansi': 'هانزي', 'vincent kompany': 'فينسنت كومباني', 'kompany': 'كومباني', 'julian nagelsmann': 'يوليان ناغلسمان', 'nagelsmann': 'ناغلسمان', 'roberto de zerbi': 'روبرتو دي زيربي', 'de zerbi': 'دي زيربي', 'hossam hassan': 'حسام حسن', 'hossam el badry': 'حسام البدري', 'marcel koller': 'مارسيل كولر', 'koller': 'كولر', 'jose riveiro': 'خوسيه ريفيرو', 'riveiro': 'ريفيرو', 'jose peseiro': 'جوزيه بيسيرو', 'peseiro': 'بيسيرو', 'ahmed abdelrauf': 'أحمد عبد الرؤوف', 'walid regragui': 'وليد الركراكي', 'regragui': 'الركراكي', 'hervé renard': 'هيرفي رينارد', 'herve renard': 'هيرفي رينارد', 'renard': 'رينارد', 'roberto mancini': 'روبرتو مانشيني', 'mancini': 'مانشيني', 'miguel cardoso': 'ميغيل كاردوسو', 'ramon diaz': 'رامون دياز', 'vladimir petkovic': 'فلاديمير بيتكوفيتش', 'petkovic': 'بيتكوفيتش',
    /* نجوم عالميون */
    'lionel messi': 'ليونيل ميسي', 'messi': 'ميسي', 'cristiano ronaldo': 'كريستيانو رونالدو', 'ronaldo': 'رونالدو', 'neymar': 'نيمار', 'kylian mbappe': 'كيليان مبابي', 'mbappe': 'مبابي', 'erling haaland': 'إيرلينغ هالاند', 'haaland': 'هالاند', 'harry kane': 'هاري كين', 'kane': 'كين',
    'vinicius junior': 'فينيسيوس جونيور', 'vinicius': 'فينيسيوس', 'jude bellingham': 'جود بيلينغهام', 'bellingham': 'بيلينغهام', 'lamine yamal': 'لامين يامال', 'yamal': 'يامال', 'pedri': 'بيدري', 'gavi': 'غافي', 'robert lewandowski': 'روبرت ليفاندوفسكي', 'lewandowski': 'ليفاندوفسكي', 'raphinha': 'رافينيا',
    'kevin de bruyne': 'كيفن دي بروين', 'de bruyne': 'دي بروين', 'bukayo saka': 'بوكايو ساكا', 'saka': 'ساكا', 'phil foden': 'فيل فودين', 'foden': 'فودين', 'declan rice': 'ديكلان رايس', 'rice': 'رايس', 'martin odegaard': 'مارتن أوديغارد', 'odegaard': 'أوديغارد', 'bruno fernandes': 'برونو فرنانديش',
    'marcus rashford': 'ماركوس راشفورد', 'rashford': 'راشفورد', 'son heung min': 'سون هيونغ مين', 'son': 'سون', 'virgil van dijk': 'فيرجيل فان دايك', 'van dijk': 'فان دايك', 'alisson': 'أليسون', 'alisson becker': 'أليسون', 'trent alexander arnold': 'ترينت ألكسندر أرنولد', 'alexander arnold': 'ألكسندر أرنولد',
    'cole palmer': 'كول بالمر', 'palmer': 'بالمر', 'enzo fernandez': 'إنزو فيرنانديز', 'moises caicedo': 'مويسيس كايسيدو', 'caicedo': 'كايسيدو', 'alexander isak': 'ألكسندر إيزاك', 'isak': 'إيزاك', 'ollie watkins': 'أولي واتكينز', 'watkins': 'واتكينز', 'bernardo silva': 'برناردو سيلفا', 'rodri': 'رودري', 'ederson': 'إدرسون', 'ruben dias': 'روبين دياز', 'dias': 'دياز',
    'thibaut courtois': 'تيبو كورتوا', 'courtois': 'كورتوا', 'luka modric': 'لوكا مودريتش', 'modric': 'مودريتش', 'toni kroos': 'توني كروس', 'kroos': 'كروس', 'federico valverde': 'فيدي فالفيردي', 'valverde': 'فالفيردي', 'rodrygo': 'رودريغو', 'eduardo camavinga': 'إدواردو كامافينغا', 'camavinga': 'كامافينغا', 'aurelien tchouameni': 'أوريليان تشواميني', 'tchouameni': 'تشواميني', 'antonio rudiger': 'أنتونيو روديغر', 'rudiger': 'روديغر', 'dani carvajal': 'داني كارفاخال', 'carvajal': 'كارفاخال', 'david alaba': 'ديفيد ألابا', 'alaba': 'ألابا', 'arda guler': 'أردا غولر', 'guler': 'غولر',
    'marc andre ter stegen': 'تير شتيغن', 'ter stegen': 'تير شتيغن', 'jules kounde': 'جول كوندي', 'kounde': 'كوندي', 'ronald araujo': 'رونالد أراوخو', 'araujo': 'أراوخو', 'frenkie de jong': 'فرينكي دي يونغ', 'de jong': 'دي يونغ', 'fermin lopez': 'فيرمين لوبيز', 'dani olmo': 'داني أولمو', 'olmo': 'أولمو', 'ferran torres': 'فيران توريس', 'joao cancelo': 'جواو كانسيلو', 'cancelo': 'كانسيلو', 'inigo martinez': 'إينيغو مارتينيز', 'wojciech szczesny': 'فويتشيك تشيزني', 'szczesny': 'تشيزني',
    'antoine griezmann': 'أنطوان غريزمان', 'griezmann': 'غريزمان', 'alvaro morata': 'ألفارو موراتا', 'morata': 'موراتا', 'julian alvarez': 'خوليان ألفاريز', 'jan oblak': 'يان أوبلاك', 'oblak': 'أوبلاك', 'koke': 'كوكي', 'alexander sorloth': 'ألكسندر سورلوث', 'sorloth': 'سورلوث', 'marcos llorente': 'ماركوس يورنتي',
    'harry maguire': 'هاري ماغواير', 'maguire': 'ماغواير', 'andre onana': 'أندريه أونانا', 'onana': 'أونانا', 'casemiro': 'كاسيميرو', 'lisandro martinez': 'ليساندرو مارتينيز', 'matthijs de ligt': 'ماتيس دي ليخت', 'de ligt': 'دي ليخت', 'kobbie mainoo': 'كوبي ماينو', 'mainoo': 'ماينو', 'alejandro garnacho': 'أليخاندرو غارناتشو', 'garnacho': 'غارناتشو', 'rasmus hojlund': 'راسموس هويلوند', 'hojlund': 'هويلوند',
    'jamal musiala': 'جمال موسيالا', 'musiala': 'موسيالا', 'joshua kimmich': 'جوشوا كيميتش', 'kimmich': 'كيميتش', 'manuel neuer': 'مانويل نوير', 'neuer': 'نوير', 'leroy sane': 'ليروي ساني', 'sane': 'ساني', 'serge gnabry': 'سيرج غنابري', 'gnabry': 'غنابري', 'thomas muller': 'توماس مولر', 'muller': 'مولر', 'michael olise': 'مايكل أوليسي', 'olise': 'أوليسي', 'dayot upamecano': 'دايو أوباميكانو', 'upamecano': 'أوباميكانو', 'kim min jae': 'كيم مين جاي', 'luis diaz': 'لويس دياز',
    'florian wirtz': 'فلوريان فيرتز', 'wirtz': 'فيرتز', 'granit xhaka': 'غرانيت تشاكا', 'xhaka': 'تشاكا', 'victor boniface': 'فيكتور بونيفاس', 'boniface': 'بونيفاس', 'serhou guirassy': 'سيرهو غيراسي', 'guirassy': 'غيراسي', 'julian brandt': 'يوليان براندت', 'brandt': 'براندت', 'karim adeyemi': 'كريم أدييمي', 'gregor kobel': 'غريغور كوبيل', 'kobel': 'كوبيل',
    'ousmane dembele': 'عثمان ديمبيلي', 'dembele': 'ديمبيلي', 'achraf': 'أشرف', 'vitinha': 'فيتينيا', 'marquinhos': 'ماركينيوس', 'gianluigi donnarumma': 'جيانلويجي دوناروما', 'donnarumma': 'دوناروما', 'bradley barcola': 'برادلي باركولا', 'barcola': 'باركولا', 'desire doue': 'ديزيريه دويه', 'doue': 'دويه', 'joao neves': 'جواو نيفيز', 'warren zaire emery': 'وارن زائير إيمري', 'zaire emery': 'زائير إيمري', 'khvicha kvaratskhelia': 'خفيتشا كفاراتسخيليا', 'kvaratskhelia': 'كفاراتسخيليا', 'fabian ruiz': 'فابيان رويز',
    'lautaro martinez': 'لاوتارو مارتينيز', 'nicolo barella': 'نيكولو باريلا', 'barella': 'باريلا', 'hakan calhanoglu': 'هاكان تشالهان أوغلو', 'calhanoglu': 'تشالهان أوغلو', 'marcus thuram': 'ماركوس تورام', 'thuram': 'تورام', 'yann sommer': 'يان زومر', 'sommer': 'زومر', 'alessandro bastoni': 'أليساندرو باستوني', 'bastoni': 'باستوني', 'federico dimarco': 'فيديريكو ديماركو', 'dimarco': 'ديماركو',
    'rafael leao': 'رافائيل لياو', 'leao': 'لياو', 'christian pulisic': 'كريستيان بوليسيتش', 'pulisic': 'بوليسيتش', 'mike maignan': 'مايك مينيان', 'maignan': 'مينيان', 'tijjani reijnders': 'تيجاني رايندرز', 'reijnders': 'رايندرز', 'theo hernandez': 'ثيو هيرنانديز', 'dusan vlahovic': 'دوشان فلاهوفيتش', 'vlahovic': 'فلاهوفيتش', 'kenan yildiz': 'كينان يلدز', 'yildiz': 'يلدز', 'federico chiesa': 'فيديريكو كييزا', 'chiesa': 'كييزا', 'paulo dybala': 'باولو ديبالا', 'dybala': 'ديبالا', 'romelu lukaku': 'روميلو لوكاكو', 'lukaku': 'لوكاكو', 'scott mctominay': 'سكوت ماكتوميناي', 'mctominay': 'ماكتوميناي',
    'victor osimhen': 'فيكتور أوسيمين', 'osimhen': 'أوسيمين', 'sadio mane': 'ساديو ماني', 'mane': 'ماني', 'kalidou koulibaly': 'كاليدو كوليبالي', 'koulibaly': 'كوليبالي', 'edouard mendy': 'إدوارد ميندي', 'mendy': 'ميندي', 'nicolas jackson': 'نيكولاس جاكسون', 'pape matar sarr': 'بابي مطر سار', 'ismaila sarr': 'إسماعيلا سار', 'sarr': 'سار', 'iliman ndiaye': 'إيليمان ندياي', 'ndiaye': 'ندياي',
    'wilfried zaha': 'ويلفريد زاها', 'zaha': 'زاها', 'sebastien haller': 'سيباستيان هالر', 'haller': 'هالر', 'franck kessie': 'فرانك كيسي', 'kessie': 'كيسي', 'simon adingra': 'سيمون أدينغرا', 'andre ayew': 'أندريه أيو', 'mohammed kudus': 'محمد قدوس', 'kudus': 'قدوس', 'thomas partey': 'توماس بارتي', 'partey': 'بارتي', 'inaki williams': 'إيناكي ويليامز', 'andre zambo anguissa': 'أندريه زامبو أنغيسا', 'anguissa': 'أنغيسا', 'victor wanyama': 'فيكتور وانياما', 'bryan mbeumo': 'براين مبومو', 'mbeumo': 'مبومو',
    'antony': 'أنتوني', 'richarlison': 'ريتشارليسون', 'gabriel jesus': 'غابرييل جيسوس', 'gabriel martinelli': 'غابرييل مارتينيلي', 'martinelli': 'مارتينيلي', 'bruno guimaraes': 'برونو غيمارايش', 'lucas paqueta': 'لوكاس باكيتا', 'paqueta': 'باكيتا', 'endrick': 'إندريك', 'savinho': 'سافينيو', 'matheus cunha': 'ماتيوس كونيا', 'cunha': 'كونيا',
    'angel di maria': 'أنخيل دي ماريا', 'di maria': 'دي ماريا', 'paulo': 'باولو', 'emiliano martinez': 'إميليانو مارتينيز', 'alexis mac allister': 'أليكسيس ماك أليستر', 'mac allister': 'ماك أليستر', 'rodrigo de paul': 'رودريغو دي بول', 'de paul': 'دي بول', 'nicolas otamendi': 'نيكولاس أوتاميندي', 'otamendi': 'أوتاميندي', 'luis suarez': 'لويس سواريز', 'suarez': 'سواريز', 'edinson cavani': 'إدينسون كافاني', 'cavani': 'كافاني', 'darwin nunez': 'داروين نونيز', 'nunez': 'نونيز', 'james rodriguez': 'خاميس رودريغيز', 'luis diaz colombia': 'لويس دياز', 'alexis sanchez': 'أليكسيس سانشيز', 'arturo vidal': 'أرتورو فيدال',
    'diogo jota': 'ديوغو جوتا', 'jota': 'جوتا', 'joao felix': 'جواو فيليكس', 'felix': 'فيليكس', 'rafael silva': 'رافائيل سيلفا', 'bernardo': 'برناردو', 'ruben neves': 'روبين نيفيز', 'neves': 'نيفيز', 'nuno mendes': 'نونو مينديز', 'goncalo ramos': 'غونزالو راموس', 'ramos': 'راموس', 'pepe': 'بيبي', 'vitor roque': 'فيتور روكي', 'sebastian coates': 'سيباستيان كوتس', 'viktor gyokeres': 'فيكتور غيوكيريس', 'gyokeres': 'غيوكيريس', 'pedro goncalves': 'بيدرو غونسالفيس', 'francisco trincao': 'فرانسيسكو تريكاو', 'trincao': 'تريكاو',
    'kevin': 'كيفن', 'luis': 'لويس', 'jordan pickford': 'جوردان بيكفورد', 'pickford': 'بيكفورد', 'kyle walker': 'كايل ووكر', 'walker': 'ووكر', 'john stones': 'جون ستونز', 'stones': 'ستونز', 'jack grealish': 'جاك غريليش', 'grealish': 'غريليش', 'jarrod bowen': 'جارود بوين', 'bowen': 'بوين', 'dominic solanke': 'دومينيك سولانكي', 'solanke': 'سولانكي', 'cody gakpo': 'كودي خاكبو', 'gakpo': 'خاكبو', 'dominik szoboszlai': 'دومينيك سوبوسلاي', 'szoboszlai': 'سوبوسلاي', 'andrew robertson': 'أندرو روبرتسون', 'robertson': 'روبرتسون', 'ryan gravenberch': 'رايان خرافنبيرخ', 'gravenberch': 'خرافنبيرخ', 'florian': 'فلوريان', 'ibrahima konate': 'إبراهيما كوناتي', 'konate': 'كوناتي', 'darwin': 'داروين', 'wataru endo': 'واتارو إندو', 'endo': 'إندو', 'curtis jones': 'كورتيس جونز', 'conor bradley': 'كونور برادلي',
    'bukayo': 'بوكايو', 'william saliba': 'ويليام ساليبا', 'saliba': 'ساليبا', 'gabriel magalhaes': 'غابرييل ماغالهايش', 'ben white': 'بن وايت', 'david raya': 'ديفيد رايا', 'raya': 'رايا', 'kai havertz': 'كاي هافرتز', 'havertz': 'هافرتز', 'leandro trossard': 'ليياندرو تروسار', 'trossard': 'تروسار', 'thomas': 'توماس', 'viktor': 'فيكتور', 'riccardo calafiori': 'ريكاردو كالافيوري', 'calafiori': 'كالافيوري', 'mikel merino': 'ميكل ميرينو', 'merino': 'ميرينو', 'eberechi eze': 'إيبيريتشي إيزي', 'eze': 'إيزي',
    'mohammed kudus ghana': 'محمد قدوس', 'pedro porro': 'بيدرو بورو', 'micky van de ven': 'ميكي فان دي فين', 'van de ven': 'فان دي فين', 'james maddison': 'جيمس ماديسون', 'maddison': 'ماديسون', 'dejan kulusevski': 'ديان كولوسيفسكي', 'kulusevski': 'كولوسيفسكي', 'guglielmo vicario': 'غوليلمو فيكاريو', 'vicario': 'فيكاريو', 'cristian romero': 'كريستيان روميرو', 'romero': 'روميرو', 'richarlison de andrade': 'ريتشارليسون',
    'alexander': 'ألكسندر', 'joao pedro': 'جواو بيدرو', 'yoane wissa': 'يوان ويسا', 'wissa': 'ويسا', 'kaoru mitoma': 'كاورو ميتوما', 'mitoma': 'ميتوما', 'takefusa kubo': 'تاكيفوسا كوبو', 'kubo': 'كوبو', 'takehiro tomiyasu': 'تاكيهيرو تومياسو', 'daichi kamada': 'دايتشي كامادا', 'kamada': 'كامادا', 'hwang hee chan': 'هوانغ هي تشان', 'lee kang in': 'لي كانغ إن', 'kang in lee': 'لي كانغ إن',
    'gianluca scamacca': 'جيانلوكا سكاماكا', 'ademola lookman': 'أديمولا لوكمان', 'lookman': 'لوكمان', 'mateo retegui': 'ماتيو ريتيغي', 'retegui': 'ريتيغي', 'ederson dos santos': 'إيدرسون', 'marten de roon': 'مارتن دي رون', 'de roon': 'دي رون',
    'hirving lozano': 'هيرفينغ لوزانو', 'lozano': 'لوزانو', 'raul jimenez': 'راؤول خيمينيز', 'santiago gimenez': 'سانتياغو خيمينيز', 'gimenez': 'خيمينيز', 'guillermo ochoa': 'غييرمو أوتشوا', 'ochoa': 'أوتشوا', 'alphonso davies': 'ألفونسو ديفيس', 'davies': 'ديفيس', 'jonathan david': 'جوناثان ديفيد', 'christian pulisic usa': 'كريستيان بوليسيتش', 'weston mckennie': 'ويستون ماكيني', 'mckennie': 'ماكيني', 'giorgio chiellini': 'جورجيو كيليني', 'sergio busquets': 'سيرجيو بوسكيتس', 'busquets': 'بوسكيتس', 'jordi alba': 'جوردي ألبا', 'alba': 'ألبا', 'luis suarez inter miami': 'لويس سواريز',
    'karim benzema': 'كريم بنزيما', 'benzema': 'بنزيما', 'ngolo kante': 'نغولو كانتي', 'kante': 'كانتي', 'n golo kante': 'نغولو كانتي', 'moussa diaby': 'موسى ديابي', 'diaby': 'ديابي', 'ruben': 'روبين', 'roberto firmino': 'روبيرتو فيرمينو', 'firmino': 'فيرمينو', 'marcelo brozovic': 'مارسيلو بروزوفيتش', 'brozovic': 'بروزوفيتش', 'aleksandar mitrovic': 'ألكسندر ميتروفيتش', 'mitrovic': 'ميتروفيتش', 'sergej milinkovic savic': 'سيرغي ميلينكوفيتش سافيتش', 'milinkovic savic': 'ميلينكوفيتش سافيتش', 'malcom': 'مالكوم', 'joao cancelo hilal': 'جواو كانسيلو', 'kalidou': 'كاليدو', 'ruben neves hilal': 'روبين نيفيز', 'yassine bono': 'ياسين بونو', 'aymeric laporte': 'إيمريك لابورت', 'laporte': 'لابورت', 'sadio': 'ساديو', 'otavio': 'أوتافيو', 'marcelo': 'مارسيلو', 'ivan toney': 'إيفان توني', 'toney': 'توني', 'franck': 'فرانك', 'mahrez al ahli': 'رياض محرز', 'edouard': 'إدوارد', 'roger ibanez': 'روجر إيبانيز', 'ibanez': 'إيبانيز', 'gabri veiga': 'غابري فيغا', 'veiga': 'فيغا', 'enzo millot': 'إنزو ميلو', 'merih demiral': 'ميريح ديميرال', 'demiral': 'ديميرال', 'aleksandar': 'ألكسندر', 'jhon duran': 'جون دوران', 'duran': 'دوران', 'kingsley coman': 'كينغسلي كومان', 'coman': 'كومان', 'angelo gabriel': 'أنجيلو', 'talisca': 'تاليسكا', 'anderson talisca': 'أندرسون تاليسكا', 'sadio mane nassr': 'ساديو ماني', 'otavio nassr': 'أوتافيو', 'inigo martinez nassr': 'إينيغو مارتينيز', 'mohamed simakan': 'محمد سيماكان', 'simakan': 'سيماكان', 'nawaf boushal': 'نواف بوشل', 'ayman yahya': 'أيمن يحيى', 'abdullah al hamdan': 'عبد الله الحمدان', 'al hamdan': 'الحمدان', 'ali al bulaihi': 'علي البليهي', 'al bulaihi': 'البليهي', 'hassan tambakti': 'حسن تمبكتي', 'tambakti': 'تمبكتي', 'mohammed kanno': 'محمد كنو', 'kanno': 'كنو', 'nasser al dawsari': 'ناصر الدوسري', 'saleh al shehri': 'صالح الشهري', 'al shehri': 'الشهري', 'abdulrahman ghareeb': 'عبد الرحمن غريب', 'ghareeb': 'غريب', 'turki al ammar': 'تركي العمار', 'al ammar': 'العمار', 'mohammed al qahtani': 'محمد القحطاني', 'al qahtani': 'القحطاني', 'fahad al muwallad': 'فهد المولد', 'al muwallad': 'المولد', 'abdulelah al amri': 'عبد الإله العمري', 'al amri': 'العمري', 'khalid al ghannam': 'خالد الغنام', 'al ghannam': 'الغنام', 'sultan al ghannam': 'سلطان الغنام', 'ali majrashi': 'علي مجرشي', 'majrashi': 'مجرشي',
  };

  const STRIP = new Set(['fc', 'cf', 'sc', 'afc', 'fk', 'sk', 'club', 'the']);
  const key = (name) => String(name ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/).filter((w) => w && !STRIP.has(w)).join(' ');

  // نعيد بناء القواميس بمفاتيح موحّدة (تُحذف fc/club.. من المفتاح) حتى تتطابق مع key() دائمًا
  const normMap = (obj) => { const m = new Map(); Object.entries(obj).forEach(([k, v]) => { const nk = key(k); if (nk && !m.has(nk)) m.set(nk, v); }); return m; };
  const TM = normMap(TEAMS);
  const PM = normMap(PLAYERS);

  /* ---------- كتابة تقريبية بالعربي لأي اسم غير موجود في القاموس ---------- */
  const WORDS = {
    real: 'ريال', united: 'يونايتد', city: 'سيتي', town: 'تاون', rovers: 'روفرز', wanderers: 'واندررز', athletic: 'أتلتيك', atletico: 'أتلتيكو', sporting: 'سبورتينغ', racing: 'راسينغ', deportivo: 'ديبورتيفو',
    olympique: 'أولمبيك', olympic: 'أولمبيك', sport: 'سبورت', sports: 'سبورتس', dynamo: 'دينامو', inter: 'إنتر', stade: 'ستاد', union: 'يونيون', albion: 'ألبيون', county: 'كاونتي', rangers: 'رينجرز', athletics: 'أتلتيكس',
    de: 'دي', del: 'ديل', da: 'دا', do: 'دو', dos: 'دوس', van: 'فان', von: 'فون', di: 'دي', la: 'لا', le: 'لو', el: 'ال', al: 'ال', women: '(سيدات)', w: '(سيدات)', ii: 'الثاني', b: 'ب',
    u17: 'تحت 17', u18: 'تحت 18', u19: 'تحت 19', u20: 'تحت 20', u21: 'تحت 21', u23: 'تحت 23',
  };
  const INITIAL = { a: 'أ', b: 'ب', c: 'س', d: 'د', e: 'إ', f: 'ف', g: 'ج', h: 'هـ', i: 'إ', j: 'ج', k: 'ك', l: 'ل', m: 'م', n: 'ن', o: 'أ', p: 'ب', q: 'ك', r: 'ر', s: 'س', t: 'ت', u: 'أ', v: 'ف', w: 'و', x: 'إ', y: 'ي', z: 'ز' };
  const CONS = { b: 'ب', d: 'د', f: 'ف', h: 'ه', k: 'ك', l: 'ل', m: 'م', n: 'ن', p: 'ب', r: 'ر', s: 'س', t: 'ت', v: 'ف', w: 'و', z: 'ز', q: 'ك', x: 'كس', j: 'ج' };
  const VOW = 'aeiou';
  const translitWord = (w) => {
    if (WORDS[w]) return WORDS[w];
    if (/\d/.test(w)) return w;
    let out = '';
    for (let i = 0; i < w.length; i += 1) {
      const c = w[i]; const n = w[i + 1] || ''; const two = c + n; const three = two + (w[i + 2] || '');
      const initial = i === 0;
      if (three === 'sch') { out += 'ش'; i += 2; continue; }
      if (two === 'ch') { out += 'تش'; i += 1; continue; }
      if (two === 'sh') { out += 'ش'; i += 1; continue; }
      if (two === 'ph') { out += 'ف'; i += 1; continue; }
      if (two === 'th') { out += 'ت'; i += 1; continue; }
      if (two === 'ck') { out += 'ك'; i += 1; continue; }
      if (two === 'qu') { out += 'ك'; i += 1; if (!'ei'.includes(w[i + 1] || '')) out += 'و'; continue; }
      if (two === 'gu' && 'ei'.includes(w[i + 2] || '')) { out += 'غ'; i += 1; continue; }
      if (c === 'c') { out += 'eiy'.includes(n) ? 'س' : 'ك'; continue; }
      if (c === 'g') { out += 'eiy'.includes(n) ? 'ج' : 'غ'; continue; }
      if (two === 'ou' || two === 'oo') { out += initial ? 'أو' : 'و'; i += 1; continue; }
      if (two === 'ee') { out += initial ? 'إي' : 'ي'; i += 1; continue; }
      if (c === 'y') { out += 'ي'; continue; }
      if (VOW.includes(c)) {
        if (initial) out += { a: 'أ', e: 'إ', i: 'إ', o: 'أو', u: 'أو' }[c];
        else out += { a: 'ا', e: 'ي', i: 'ي', o: 'و', u: 'و' }[c];
        continue;
      }
      out += CONS[c] || '';
    }
    return out.replace(/(.)\1+/g, '$1');
  };
  const translit = (name, { dropStrip = false } = {}) => {
    const flat = String(name ?? '').toLowerCase().replace(/ñ/g, 'ny').replace(/ß/g, 'ss').replace(/[øö]/g, 'o').replace(/æ/g, 'ae').replace(/ł/g, 'l').replace(/đ/g, 'd').replace(/ı/g, 'i')
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!/[a-z]/.test(flat)) return String(name ?? '').trim(); // ليس لاتينيًا (عربي مثلًا): نتركه
    const tokens = flat.replace(/[^a-z0-9. ]+/g, ' ').split(/\s+/).filter(Boolean).filter((t) => !(dropStrip && STRIP.has(t)));
    const out = [];
    for (let i = 0; i < tokens.length; i += 1) {
      const t = tokens[i];
      if (/^[a-z]\.$/.test(t)) { out.push(`${INITIAL[t[0]]}.`); continue; }
      const word = t.replace(/\./g, '');
      if ((word === 'al' || word === 'el') && i < tokens.length - 1) { out.push(`ال${translitWord(tokens[i + 1].replace(/\./g, ''))}`); i += 1; continue; }
      out.push(translitWord(word));
    }
    return out.join(' ').trim();
  };

  const unknown = new Set();
  const team = (name) => {
    const original = String(name ?? '');
    if (!original) return '';
    let k = key(original);
    let base = original;
    let suffix = '';
    const age = k.match(/\su(\d\d)$/);
    if (age) { k = k.replace(/\su\d\d$/, ''); base = base.replace(/\s+U\d\d$/i, ''); suffix = ` (تحت ${age[1]})`; }
    if (/\sii$/.test(k)) { k = k.replace(/\sii$/, ''); base = base.replace(/\s+II$/i, ''); suffix += ' (الثاني)'; }
    if (/\sw$/.test(k)) { k = k.replace(/\sw$/, ''); base = base.replace(/\s+W$/i, ''); suffix = ' (سيدات)' + suffix; }
    const ar = TM.get(k);
    if (ar) return ar + suffix;
    unknown.add(original);
    return translit(base, { dropStrip: true }) + suffix;
  };

  const unknownPlayers = new Set();
  // اللاعب/المدرب: الاسم كاملًا، ثم اللقب (آخر كلمة)، وإلا كتابة تقريبية بالعربي
  const player = (name) => {
    const original = String(name ?? '').trim();
    if (!original) return '';
    const k = key(original);
    if (PM.has(k)) return PM.get(k);
    const parts = k.split(' ');
    const last = parts[parts.length - 1];
    if (parts.length > 1 && PM.has(last)) return PM.get(last);
    if (parts.length > 2 && PM.has(parts.slice(-2).join(' '))) return PM.get(parts.slice(-2).join(' '));
    unknownPlayers.add(original);
    return translit(original);
  };

  // أسماء إضافية من جدول Supabase `name_translations` (kind: team | player) — تتفوق على القاموس والكتابة التلقائية.
  const remote = { team: new Map(), player: new Map() };
  const teamFinal = (name) => remote.team.get(key(name)) || team(name);
  const playerFinal = (name) => remote.player.get(key(name)) || player(name);
  const ready = (async () => {
    try {
      const db = window.yrSupabase;
      if (!db) return;
      const { data, error } = await db.from('name_translations').select('kind,en,ar').limit(5000);
      if (error || !Array.isArray(data)) return;
      data.forEach((r) => { if (r.en && r.ar && remote[r.kind]) remote[r.kind].set(key(r.en), String(r.ar)); });
    } catch { /* الجدول اختياري */ }
  })();

  window.YR_NAMES = { team: teamFinal, player: playerFinal, translit, ready, unknown: () => ({ teams: [...unknown].sort(), players: [...unknownPlayers].sort() }) };
  window.addEventListener('load', () => setTimeout(() => {
    if (unknown.size || unknownPlayers.size) console.info('[يلا رياضة] أسماء كُتبت تلقائيًا (تقريبية) — صحّحها في names-ar.js أو جدول name_translations:', { teams: [...unknown].sort(), players: [...unknownPlayers].sort() });
  }, 2500));
})();
