// يلا رياضة — الأسماء العربية للفرق (المزوّد يرسلها بالإنجليزية).
// لإضافة فريق: أضف سطرًا في TEAMS بصيغة  'english name': 'الاسم العربي'  (حروف إنجليزية صغيرة بدون FC/CF/SC).
// أي فريق غير موجود هنا يظهر بالإنجليزية كما هو (اسم صحيح)، وبيتجمّع في لوحة التحكم ← أسماء الفرق ← «فرق محتاجة ترجمة» علشان تكتب اسمه العربي بضغطة.
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
    'el dakhleya': 'الداخلية', 'ittihad alexandria': 'الاتحاد السكندري', 'al ittihad alexandria': 'الاتحاد السكندري', 'al ittihad alexandria sc': 'الاتحاد السكندري', 'ittihad alexandria sc': 'الاتحاد السكندري', 'al ittihad': 'الاتحاد', 'ala ab el tala a': 'طلائع الجيش', 'ceramica': 'سيراميكا كليوباترا',

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

  /* ===== قاموس موسّع (أندية ومنتخبات من دوريات كتير) — لو الاسم موجود فوق، الأولوية للي فوق ===== */
  const EXTRA = {
    "udinese": "أودينيزي", "cagliari": "كالياري", "verona": "هيلاس فيرونا", "hellas verona": "هيلاس فيرونا",
    "lecce": "ليتشي", "parma": "بارما", "como": "كومو", "sassuolo": "ساسولو",
    "empoli": "إمبولي", "monza": "مونزا", "venezia": "فينيزيا", "cremonese": "كريمونيزي",
    "pisa": "بيزا", "sampdoria": "سامبدوريا", "palermo": "باليرمو", "spezia": "سبيتسيا",
    "salernitana": "ساليرنيتانا", "frosinone": "فروزينوني", "bari": "باري", "cesena": "تشيزينا",
    "mantova": "مانتوفا", "catanzaro": "كاتانزارو", "reggiana": "ريدجانا", "carrarese": "كارارايزي",
    "juve stabia": "يوفي ستابيا", "modena": "مودينا", "padova": "بادوفا", "brescia": "بريشيا",
    "cittadella": "تشيتاديلا", "augsburg": "أوغسبورغ", "mainz": "ماينز", "mainz 05": "ماينز",
    "heidenheim": "هايدنهايم", "st pauli": "سانت باولي", "holstein kiel": "هولشتاين كيل", "bochum": "بوخوم",
    "vfl bochum": "بوخوم", "koln": "كولن", "fc koln": "كولن", "cologne": "كولن",
    "hamburger sv": "هامبورغ", "hamburg": "هامبورغ", "hertha bsc": "هيرتا برلين", "hertha berlin": "هيرتا برلين",
    "schalke 04": "شالكه", "schalke": "شالكه", "hannover 96": "هانوفر", "hannover": "هانوفر",
    "fortuna dusseldorf": "فورتونا دوسلدورف", "nurnberg": "نورمبرغ", "karlsruher sc": "كارلسروه", "darmstadt 98": "دارمشتات",
    "darmstadt": "دارمشتات", "paderborn": "بادربورن", "elversberg": "إلفرسبيرغ", "kaiserslautern": "كايزرسلاوترن",
    "magdeburg": "ماغدبورغ", "greuther furth": "غروتر فورت", "ulm": "أولم", "braunschweig": "براونشفايغ",
    "eintracht braunschweig": "براونشفايغ", "preussen munster": "بروسيا مونستر", "dynamo dresden": "دينامو دريسدن", "hansa rostock": "هانزا روستوك",
    "bayern munich ii": "بايرن ميونخ (الثاني)", "angers": "أنجيه", "auxerre": "أوكسير", "le havre": "لوهافر",
    "saint etienne": "سانت إتيان", "as saint etienne": "سانت إتيان", "montpellier": "مونبلييه", "reims": "ريمس",
    "stade de reims": "ريمس", "lorient": "لوريان", "metz": "ميتز", "paris fc": "باريس إف سي",
    "clermont": "كليرمون", "clermont foot": "كليرمون", "bordeaux": "بوردو", "girondins bordeaux": "بوردو",
    "dijon": "ديجون", "caen": "كان", "sochaux": "سوشو", "guingamp": "غانغان",
    "nancy": "نانسي", "amiens": "أميان", "rodez": "رودز", "troyes": "تروا",
    "red star": "ريد ستار", "pau": "بو", "grenoble": "غرونوبل", "annecy": "أنسي",
    "laval": "لافال", "ajaccio": "أجاكسيو", "bastia": "باستيا", "dunkerque": "دنكرك",
    "martigues": "مارتيج", "sevilla fc": "إشبيلية", "real zaragoza": "ريال سرقسطة", "zaragoza": "ريال سرقسطة",
    "deportivo la coruna": "ديبورتيفو لا كورونيا", "deportivo": "ديبورتيفو لا كورونيا", "sporting gijon": "سبورتينغ خيخون", "racing santander": "راسينغ سانتاندر",
    "malaga": "مالقة", "eibar": "إيبار", "burgos": "بورغوس", "cordoba": "قرطبة",
    "albacete": "ألباسيتي", "huesca": "هويسكا", "tenerife": "تينيريفي", "cartagena": "قرطاجنة",
    "mirandes": "ميرانديس", "castellon": "كاستيون", "eldense": "إلدينسي", "racing ferrol": "راسينغ فيرول",
    "real sociedad b": "ريال سوسيداد (الثاني)", "barcelona b": "برشلونة (الثاني)", "barcelona atletic": "برشلونة (الثاني)", "atletico madrid b": "أتلتيكو مدريد (الثاني)",
    "villarreal b": "فياريال (الثاني)", "sheffield wednesday": "شيفيلد وينزداي", "sheffield wed": "شيفيلد وينزداي", "bristol city": "بريستول سيتي",
    "cardiff city": "كارديف سيتي", "swansea city": "سوانزي سيتي", "swansea": "سوانزي سيتي", "millwall": "ميلوول",
    "preston north end": "بريستون", "preston": "بريستون", "queens park rangers": "كوينز بارك رينجرز", "qpr": "كوينز بارك رينجرز",
    "plymouth argyle": "بليموث أرغايل", "plymouth": "بليموث أرغايل", "portsmouth": "بورتسموث", "oxford united": "أكسفورد يونايتد",
    "oxford": "أكسفورد يونايتد", "charlton athletic": "تشارلتون", "charlton": "تشارلتون", "wrexham": "ريكسهام",
    "reading": "ريدينغ", "huddersfield town": "هادرسفيلد", "huddersfield": "هادرسفيلد", "bolton wanderers": "بولتون",
    "bolton": "بولتون", "wigan athletic": "ويغان", "wigan": "ويغان", "barnsley": "بارنسلي",
    "rotherham united": "روثرهام", "rotherham": "روثرهام", "peterborough united": "بيتربره", "peterborough": "بيتربره",
    "lincoln city": "لينكولن سيتي", "stockport county": "ستوكبورت كاونتي", "stockport": "ستوكبورت كاونتي", "blackpool": "بلاكبول",
    "bradford city": "برادفورد سيتي", "mansfield town": "مانسفيلد", "exeter city": "إكستر سيتي", "cambridge united": "كامبريدج يونايتد",
    "leyton orient": "ليتون أورينت", "stevenage": "ستيفنيج", "northampton town": "نورثهامبتون", "crawley town": "كراولي تاون",
    "burton albion": "بيرتون ألبيون", "shrewsbury town": "شروزبري", "wycombe wanderers": "وايكومب", "notts county": "نوتس كاونتي",
    "doncaster rovers": "دونكاستر", "walsall": "وولسال", "bromley": "بروملي", "salford city": "سالفورد سيتي",
    "barrow": "بارو", "carlisle united": "كارلايل", "crewe alexandra": "كرو ألكسندرا", "gillingham": "جيلينغهام",
    "colchester united": "كولشيستر", "grimsby town": "غريمسبي", "swindon town": "سويندون", "tranmere rovers": "ترانمير",
    "port vale": "بورت فيل", "afc wimbledon": "ويمبلدون", "milton keynes dons": "إم كيه دونز", "mk dons": "إم كيه دونز",
    "cheltenham town": "تشلتنهام", "harrogate town": "هاروغيت", "morecambe": "موركامب", "newport county": "نيوبورت كاونتي",
    "accrington stanley": "أكرينغتون ستانلي", "fleetwood town": "فليتوود", "bristol rovers": "بريستول روفرز", "chesterfield": "تشيسترفيلد",
    "barnet": "بارنت", "forest green rovers": "فورست غرين", "manchester city u21": "مانشستر سيتي تحت 21", "hearts": "هارتس",
    "heart of midlothian": "هارتس", "hibernian": "هيبرنيان", "aberdeen": "أبردين", "dundee united": "دندي يونايتد",
    "dundee": "دندي", "motherwell": "موثرويل", "kilmarnock": "كيلمارنوك", "st mirren": "سانت ميرين",
    "st johnstone": "سانت جونستون", "ross county": "روس كاونتي", "livingston": "ليفينغستون", "partick thistle": "بارتيك ثيسل",
    "falkirk": "فالكيرك", "raith rovers": "رايث روفرز", "shamrock rovers": "شامروك روفرز", "shelbourne": "شيلبورن",
    "bohemians": "بوهيميانز", "derry city": "ديري سيتي", "dundalk": "دوندالك", "st patrick s athletic": "سانت باتريكس",
    "linfield": "لينفيلد", "glentoran": "غلينتوران", "cliftonville": "كليفتونفيل", "the new saints": "ذا نيو سينتس",
    "connah s quay nomads": "كونا كواي نوماد", "standard liege": "ستاندارد لييج", "westerlo": "فيستيرلو", "kv mechelen": "ميخيلين",
    "mechelen": "ميخيلين", "cercle brugge": "سيركل بروج", "oh leuven": "لوفين", "leuven": "لوفين",
    "sint truiden": "سينت تروين", "charleroi": "شارلروا", "kv kortrijk": "كورتريك", "kortrijk": "كورتريك",
    "zulte waregem": "زولته فاريغيم", "beerschot": "بيرشوت", "royal antwerp": "أنتويرب", "antwerp": "أنتويرب",
    "dender": "ديندر", "raal la louviere": "لا لوفيير", "heracles almelo": "هيراكليس", "heracles": "هيراكليس",
    "willem ii": "فيليم الثاني", "rkc waalwijk": "فالفيك", "almere city": "ألميرى سيتي", "excelsior": "إكسلسيور",
    "vitesse": "فيتيسه", "cambuur": "كامبور", "fc volendam": "فولندام", "fc emmen": "إمن",
    "fc dordrecht": "دوردريخت", "telstar": "تيلستار", "de graafschap": "دي خرافشاب", "roda jc": "رودا",
    "mvv maastricht": "ماستريخت", "jong ajax": "يونغ أياكس", "jong psv": "يونغ آيندهوفن", "vizela": "فيزيلا",
    "chaves": "شافيس", "portimonense": "بورتيمونينسي", "pacos de ferreira": "باسوش دي فيريرا", "maritimo": "ماريتيمو",
    "tondela": "تونديلا", "academico viseu": "أكاديميكو فيزيو", "alverca": "ألفيركا", "leixoes": "ليكسويس",
    "penafiel": "بينافيل", "feirense": "فيرينسي", "union de leiria": "ليريا", "uniao de leiria": "ليريا",
    "sporting braga": "براغا", "benfica b": "بنفيكا (الثاني)", "porto b": "بورتو (الثاني)", "sporting b": "سبورتينغ لشبونة (الثاني)",
    "ofi crete": "أو إف آي كريت", "volos": "فولوس", "asteras tripolis": "أستيراس تريبوليس", "atromitos": "أتروميتوس",
    "panetolikos": "بانايتوليكوس", "lamia": "لاميا", "levadiakos": "ليفاديكوس", "kifisia": "كيفيسيا",
    "apoel": "أبويل نيقوسيا", "apoel nicosia": "أبويل نيقوسيا", "omonia nicosia": "أومونيا نيقوسيا", "omonia": "أومونيا نيقوسيا",
    "anorthosis": "أنورثوسيس", "aek larnaca": "إيه إي كيه لارنكا", "apollon limassol": "أبولون ليماسول", "pafos": "بافوس",
    "paphos": "بافوس", "zenit st petersburg": "زينيت سان بطرسبرغ", "zenit": "زينيت سان بطرسبرغ", "spartak moscow": "سبارتاك موسكو",
    "cska moscow": "سيسكا موسكو", "lokomotiv moscow": "لوكوموتيف موسكو", "dynamo moscow": "دينامو موسكو", "krasnodar": "كراسنودار",
    "rubin kazan": "روبين كازان", "akhmat grozny": "أخمات غروزني", "zorya luhansk": "زوريا لوغانسك", "kolos kovalivka": "كولوس كوفاليفكا",
    "oleksandriya": "أولكسندريا", "lviv": "لفيف", "karpaty lviv": "كاربات لفيف", "metalist 1925": "ميتاليست 1925",
    "fenerbahce sk": "فنربخشة", "umraniyespor": "أمرانيه سبور", "adana demirspor": "أضنة دميرسبور", "hatayspor": "هاتاي سبور",
    "ankaragucu": "أنقرة غوجو", "fatih karagumruk": "فاتح قره جمرك", "istanbulspor": "إسطنبول سبور", "pendikspor": "بندك سبور",
    "bursaspor": "بورصا سبور", "manisa": "مانيسا", "sakaryaspor": "ساكاريا سبور", "corum": "تشوروم",
    "young boys bern": "يانغ بويز", "fc zurich": "زيورخ", "zurich": "زيورخ", "grasshopper": "غراسهوبر",
    "grasshoppers": "غراسهوبر", "st gallen": "سانت غالن", "fc st gallen": "سانت غالن", "luzern": "لوتسرن",
    "fc luzern": "لوتسرن", "sion": "سيون", "fc sion": "سيون", "winterthur": "فينترتور",
    "lausanne": "لوزان", "lausanne sport": "لوزان", "yverdon": "إيفردون", "austria wien": "أوستريا فيينا",
    "austria vienna": "أوستريا فيينا", "lask": "لاسك لينز", "lask linz": "لاسك لينز", "wolfsberger ac": "فولفسبيرغر",
    "wolfsberger": "فولفسبيرغر", "hartberg": "هارتبرغ", "blau weiss linz": "بلاو فايس لينز", "altach": "ألتاخ",
    "rheindorf altach": "ألتاخ", "sk rapid wien": "رابيد فيينا", "bohemians 1905": "بوهيميانز 1905", "banik ostrava": "بانيك أوسترافا",
    "sigma olomouc": "سيغما أولوموك", "jablonec": "يابلونيتس", "mlada boleslav": "ملادا بوليسلاف", "slovan liberec": "سلوفان ليبيريتش",
    "teplice": "تبليتسه", "hradec kralove": "هراديتس كرالوفيه", "sk sigma olomouc": "سيغما أولوموك", "legia warsaw": "ليغيا وارسو",
    "legia warszawa": "ليغيا وارسو", "lech poznan": "ليخ بوزنان", "rakow czestochowa": "راكوف تشيستوخوفا", "rakow": "راكوف تشيستوخوفا",
    "jagiellonia bialystok": "ياغيلونيا بياليستوك", "jagiellonia": "ياغيلونيا بياليستوك", "pogon szczecin": "بوغون شتشيتسين", "gornik zabrze": "غورنيك زابجي",
    "cracovia": "كراكوفيا", "cracovia krakow": "كراكوفيا", "wisla krakow": "فيسلا كراكوف", "slask wroclaw": "شلونسك فروتسواف",
    "widzew lodz": "فيدزيف لودز", "korona kielce": "كورونا كيلسه", "zaglebie lubin": "زاغلبيه لوبين", "piast gliwice": "بياست غليفيتسه",
    "radomiak radom": "رادوميك", "lechia gdansk": "لاخيا غدانسك", "motor lublin": "موتور لوبلين", "bate": "باتي بوريسوف",
    "dinamo minsk": "دينامو مينسك", "steaua bucharest": "ستيوا بوخارست", "dinamo bucuresti": "دينامو بوخارست", "rapid bucuresti": "رابيد بوخارست",
    "universitatea craiova": "كرايوفا", "cfr cluj": "كلوج", "farul constanta": "فارول كونستانتا", "sepsi": "سيبسي",
    "uta arad": "أوتا أراد", "petrolul ploiesti": "بتروليول", "voluntari": "فولونتاري", "fk crvena zvezda": "النجم الأحمر",
    "fk partizan": "بارتيزان", "vojvodina": "فويفودينا", "backa topola": "باتشكا توبولا", "tsc backa topola": "باتشكا توبولا",
    "cukaricki": "تشوكاريتشكي", "radnicki nis": "رادنيتشكي نيش", "hnk rijeka": "ريكا", "rijeka": "ريكا",
    "osijek": "أوسييك", "lokomotiva zagreb": "لوكوموتيفا زغرب", "gorica": "غوريتسا", "istra 1961": "إستريا 1961",
    "olimpija ljubljana": "أوليمبيا ليوبليانا", "maribor": "ماريبور", "celje": "تسيليه", "koper": "كوبر",
    "zrinjski mostar": "زرينيسكي موستار", "sarajevo": "سراييفو", "fk sarajevo": "سراييفو", "zeljeznicar": "زيلييزنيتشار",
    "borac banja luka": "بوراك بانيا لوكا", "tirana": "تيرانا", "partizani": "بارتيزاني", "skenderbeu": "سكندربو",
    "shkendija": "شكيندييا", "struga": "ستروغا", "vardar": "فاردار", "sutjeska": "سوتييسكا",
    "buducnost podgorica": "بودوتشنوست", "levski sofia": "ليفسكي صوفيا", "cska sofia": "سيسكا صوفيا", "cska 1948": "سيسكا 1948",
    "lokomotiv plovdiv": "لوكوموتيف بلوفديف", "botev plovdiv": "بوتيف بلوفديف", "cska sofia fc": "سيسكا صوفيا", "ferencvarosi tc": "فيرنسفاروش",
    "ujpest": "أوييبست", "debrecen": "ديبريتسين", "paks": "باكش", "mol fehervar": "فيهيرفار",
    "kisvarda": "كيشفاردا", "slovan": "سلوفان براتيسلافا", "spartak trnava": "سبارتاك ترنافا", "dac dunajska streda": "دوناي ستريدا",
    "zilina": "جيلينا", "ms zilina": "جيلينا", "trencin": "ترينتشين", "aik": "إيه آي كيه",
    "aik stockholm": "إيه آي كيه", "ifk goteborg": "غوتنبرغ", "goteborg": "غوتنبرغ", "ifk norrkoping": "نورشوبينغ",
    "norrkoping": "نورشوبينغ", "elfsborg": "إلفسبورغ", "if elfsborg": "إلفسبورغ", "mjallby": "ميالبي",
    "mjallby aif": "ميالبي", "kalmar ff": "كالمار", "bk hacken": "هاكن", "hacken": "هاكن",
    "varbergs bois": "فاربرغ", "sirius": "سيريوس", "degerfors": "ديجيرفورس", "halmstad": "هالمستاد",
    "brommapojkarna": "بروماپويكارنا", "vaalerenga": "فاليرينغا", "rosenborg": "روزنبورغ", "brann": "برين",
    "viking": "فايكنغ", "viking fk": "فايكنغ", "lillestrom": "ليلستروم", "tromso": "ترومسو",
    "sarpsborg 08": "ساربسبورغ", "stromsgodset": "ستروم غودست", "haugesund": "هاوغيسوند", "fredrikstad": "فريدريكستاد",
    "kristiansund": "كريستيانسوند", "sandefjord": "ساندفيورد", "odd": "أود", "aalesund": "أولسوند",
    "fc nordsjaelland": "نوردشيلاند", "nordsjaelland": "نوردشيلاند", "aarhus": "آرهوس", "agf aarhus": "آرهوس",
    "agf": "آرهوس", "aalborg": "آلبورغ", "aab": "آلبورغ", "silkeborg": "سيلكيبورغ",
    "randers": "راندرس", "randers fc": "راندرس", "viborg": "فيبورغ", "vejle": "فايله",
    "sonderjyske": "سوندرييسكي", "lyngby": "لينغبي", "hvidovre": "هفيدوفره", "hjk": "هلسنكي",
    "hjk helsinki": "هلسنكي", "kups": "كوبس", "breidablik": "بريدابليك", "valur": "فالور",
    "vikingur reykjavik": "فيكينغور ريكيافيك", "dinamo tbilisi": "دينامو تبليسي", "dila gori": "ديلا غوري", "torpedo kutaisi": "توربيدو كوتايسي",
    "pyunik": "بيونيك", "noah": "نوا", "ararat armenia": "أرارات أرمينيا", "neftci baku": "نفطجي باكو",
    "sabah fk": "صباح", "zira": "زيرا", "sumqayit": "سومغايت", "kairat almaty": "كايرات ألماتي",
    "kairat": "كايرات ألماتي", "astana": "أستانا", "fc astana": "أستانا", "tobol": "توبول",
    "aktobe": "أكتوبي", "ordabasy": "أوردباسي", "pakhtakor": "باختاكور", "nasaf": "ناساف",
    "nasaf qarshi": "ناساف", "bunyodkor": "بونيودكور", "lokomotiv tashkent": "لوكوموتيف طشقند", "sogdiana": "سوغديانا",
    "pyramids fc": "بيراميدز", "al ahly sc cairo": "الأهلي", "zamalek sporting club": "الزمالك", "tersana": "ترسانة",
    "el gaish": "الجيش", "el geish": "الجيش", "al ittihad al sakandary": "الاتحاد السكندري", "el mokawloon": "المقاولون العرب",
    "al mokawloon": "المقاولون العرب", "el entag": "الإنتاج الحربي", "el ismaily": "الإسماعيلي", "ismaily sc": "الإسماعيلي",
    "el masry": "المصري", "al masry sc": "المصري", "al masry club": "المصري", "modern future fc": "مودرن سبورت",
    "future fc": "فيوتشر", "fc masr": "إف سي مصر", "ghazl el mehalla": "غزل المحلة", "el mahalla": "غزل المحلة",
    "la viena": "لافيينا", "la viena fc": "لافيينا", "koroum": "كوروم", "kouroum": "كوروم",
    "proud": "براود", "el sekka el hadid": "السكة الحديد", "sekka el hadid": "السكة الحديد", "al nasr cairo": "النصر",
    "el nasr": "النصر", "el qanah": "القناة", "el shams": "الشمس", "el shorta": "الشرطة",
    "el sharkia": "الشرقية للدخان", "tanta": "طنطا", "damietta": "دمياط", "beni suef": "بني سويف",
    "al ahly benghazi": "الأهلي بنغازي", "al ahly tripoli": "الأهلي طرابلس", "al nassr fc": "النصر", "al hilal fc": "الهلال",
    "al shabab riyadh": "الشباب", "al ettifaq fc": "الاتفاق", "al taawon": "التعاون", "al fateh sc": "الفتح",
    "al khaleej saihat": "الخليج", "al riyadh sc": "الرياض", "al raed sc": "الرائد", "al qadisiyah": "القادسية",
    "al qadsiah fc": "القادسية", "al kholood club": "الخلود", "al orubah": "العروبة", "al orobah fc": "العروبة",
    "al wehda mecca": "الوحدة", "al faisaly": "الفيصلي", "al faisaly harmah": "الفيصلي", "al ahli sfc": "الأهلي السعودي",
    "al-nassr": "النصر", "al-hilal": "الهلال", "al-ittihad": "الاتحاد", "al-ahli": "الأهلي السعودي",
    "al-shabab": "الشباب", "al-ettifaq": "الاتفاق", "al-taawoun": "التعاون", "al-fateh": "الفتح",
    "al-fayha": "الفيحاء", "al-raed": "الرائد", "al-khaleej": "الخليج", "al-riyadh": "الرياض",
    "al-qadsiah": "القادسية", "al-kholood": "الخلود", "al-okhdood": "الأخدود", "al-najma": "النجمة",
    "al-hazem": "الحزم", "al-orobah": "العروبة", "al-wehda": "الوحدة", "al-tai": "الطائي",
    "al-jabalain": "الجبلين", "al-bukayriyah": "البكيرية", "al bukayriyah": "البكيرية", "al-washm": "الوشم",
    "al washm": "الوشم", "al-arabi": "العربي", "al-diriyah": "الدرعية", "al-zulfi": "الزلفي",
    "al-qous": "القوس", "al-ula": "العلا", "al-ula fc": "العلا", "al-jandal": "الجندل",
    "al-safa": "الصفا", "al-thoqbah": "الثقبة", "al-kawkab": "الكوكب", "al-sahel": "الساحل",
    "al-entesar": "الانتصار", "al-nahda": "النهضة", "al-nojoom": "النجوم", "al-adalah": "العدالة",
    "al-batin": "الباطن", "al-jubail": "الجبيل", "al-ain saudi": "العين السعودي", "al-hamadah": "الحمادة",
    "al-ahli saudi": "الأهلي السعودي", "al-wahda mecca": "الوحدة", "al ain fc": "العين", "al wahda fc": "الوحدة الإماراتي",
    "al jazira club": "الجزيرة", "al wasl fc": "الوصل", "al nasr sc": "النصر الإماراتي", "khor fakkan": "خورفكان",
    "al khaleej": "الخليج", "ajman": "عجمان", "al ittihad kalba": "اتحاد كلباء", "ittihad kalba": "اتحاد كلباء",
    "emirates club": "الإمارات", "fujairah": "الفجيرة", "al bataeh": "البطائح", "al hamriyah": "الحمرية",
    "hatta": "حتا", "baniyas": "بني ياس", "al sadd sc": "السد", "al duhail sc": "الدحيل",
    "al gharafa sc": "الغرافة", "al rayyan sc": "الريان", "al arabi sc": "العربي", "al wakrah sc": "الوكرة",
    "al ahli doha": "الأهلي القطري", "qatar sc doha": "قطر", "al markhiya": "المرخية", "al shahaniya": "الشحانية",
    "muaither": "معيذر", "al kharaitiyat": "الخريطيات", "al kuwait sc": "الكويت", "kuwait sc": "الكويت",
    "al salmiya": "السالمية", "al fahaheel": "الفحيحيل", "al jahra": "الجهراء", "kazma": "كاظمة",
    "al tadamon": "التضامن", "al yarmouk": "اليرموك", "al nasr kuwait": "النصر الكويتي", "al muharraq": "المحرق",
    "al riffa": "الرفاع", "al khaldiya": "الخالدية", "manama club": "المنامة", "al ahli bahrain": "الأهلي البحريني",
    "east riffa": "الرفاع الشرقي", "al hidd": "الحد", "al seeb": "السيب", "dhofar": "ظفار",
    "oman club": "عمان", "al nahda oman": "النهضة العماني", "sohar": "صحار", "al suwaiq": "السويق",
    "al shabab oman": "الشباب العماني", "al zawraa": "الزوراء", "al quwa al jawiya": "القوة الجوية", "air force club": "القوة الجوية",
    "al shorta": "الشرطة العراقي", "al talaba": "الطلبة", "al najaf": "النجف", "duhok": "دهوك",
    "erbil": "أربيل", "newroz": "نوروز", "al karkh": "الكرخ", "al minaa": "الميناء",
    "naft al wasat": "نفط الوسط", "al kahrabaa": "الكهرباء", "al faisaly amman": "الفيصلي الأردني", "al wehdat": "الوحدات",
    "al ramtha": "الرمثا", "al hussein irbid": "الحسين إربد", "al jazeera amman": "الجزيرة الأردني", "al salt": "السلط",
    "shabab al ordon": "شباب الأردن", "al jaish": "الجيش السوري", "al wathba": "الوثبة", "al karamah": "الكرامة",
    "tishreen": "تشرين", "al ittihad aleppo": "الاتحاد الحلبي", "al nejmeh": "النجمة اللبناني", "al ahed": "العهد",
    "al ansar": "الأنصار", "safa sc": "الصفاء", "racing beirut": "راسينغ بيروت", "shabab al khalil": "شباب الخليل",
    "hilal al quds": "هلال القدس", "cr belouizdad": "شباب بلوزداد", "usm alger": "اتحاد الجزائر", "mc alger": "مولودية الجزائر",
    "es setif": "وفاق سطيف", "js kabylie": "شبيبة القبائل", "mc oran": "مولودية وهران", "cs constantine": "شباب قسنطينة",
    "usm el harrach": "اتحاد الحراش", "mc el bayadh": "مولودية البيض", "es mostaganem": "وفاق مستغانم", "asm oran": "أولمبي وهران",
    "sc mascara": "سريع المحمدية", "jsm skikda": "جمعية سكيكدة", "olympique akbou": "أولمبيك أقبو", "mc saida": "مولودية سعيدة",
    "us souf": "اتحاد سوف", "paradou": "بارادو", "es tunis": "الترجي التونسي", "cs sfaxien": "الصفاقسي",
    "club africain tunis": "الإفريقي", "ca bizertin": "النادي البنزرتي", "us monastirienne": "الاتحاد المنستيري", "es sahel": "النجم الساحلي",
    "es metlaoui": "أولمبي مطلوي", "stade tunisien": "الستاد التونسي", "as gabes": "جمعية قابس", "as marsa": "المرسى",
    "us ben guerdane": "بن قردان", "ao kerkennah": "قرقنة", "es hammam sousse": "حمام سوسة", "raja ca": "الرجاء",
    "wydad ac": "الوداد", "rs berkane": "نهضة بركان", "far rabat": "الجيش الملكي", "hassania agadir": "حسنية أكادير",
    "fus rabat": "الفتح الرباطي", "mas fez": "المغرب الفاسي", "renaissance zemamra": "نهضة الزمامرة", "rca zemamra": "نهضة الزمامرة",
    "olympic safi": "أولمبيك آسفي", "ittihad tanger": "اتحاد طنجة", "kawkab marrakech": "الكوكب المراكشي", "cod meknes": "الكوديم المكناسي",
    "codm meknes": "الكوديم المكناسي", "youssoufia berrechid": "اتحاد يوسفية برشيد", "us touarga": "اتحاد تواركة", "union touarga": "اتحاد تواركة",
    "sporting club mohamed v": "الدفاع الحسني الجديدي", "al ahli tripoli sc": "الأهلي طرابلس", "al ittihad libya": "الاتحاد الليبي", "al akhdar": "الأخضر",
    "al ahly benghazi sc": "الأهلي بنغازي", "al hilal benghazi": "الهلال بنغازي", "al tahaddy": "التحدي", "al shat": "الشط",
    "al nasr libya": "النصر الليبي", "al hilal omdurman fc": "الهلال السوداني", "al merreikh omdurman": "المريخ السوداني", "al merrikh sc": "المريخ السوداني",
    "al ahly shendi": "الأهلي شندي", "hay al arab": "حي العرب", "al ahli khartoum": "الأهلي الخرطوم", "al hilal kadugli": "الهلال كادوقلي",
    "horoya ac": "حوريا", "horoya conakry": "حوريا", "al ahli wad madani": "الأهلي ود مدني", "asec mimosas abidjan": "أسيك ميموزا",
    "asec": "أسيك ميموزا", "africa sports": "أفريكا سبورتس", "sc gagnoa": "غاغنوا", "san pedro": "سان بيدرو",
    "stade d abidjan": "ستاد أبيدجان", "hearts of oak": "هارتس أوف أوك", "asante kotoko": "أسانتي كوتوكو", "accra hearts of oak": "هارتس أوف أوك",
    "medeama": "ميديما", "aduana stars": "أدوانا ستارز", "dreams fc": "دريمز", "bibiani gold stars": "بيبياني",
    "karela united": "كاريلا يونايتد", "enyimba": "إنييمبا", "kano pillars": "كانو بيلرز", "rivers united fc": "ريفرز يونايتد",
    "plateau united": "بلاتو يونايتد", "shooting stars": "شوتينغ ستارز", "enugu rangers": "إنوغو رينجرز", "lobi stars": "لوبي ستارز",
    "bendel insurance": "بيندل إنشورانس", "heartland": "هارتلاند", "abia warriors": "أبيا ووريورز", "wikki tourists": "ويكي توريستس",
    "akwa united": "أكوا يونايتد", "remo stars fc": "ريمو ستارز", "sunshine stars": "صنشاين ستارز", "el kanemi warriors": "الكانمي",
    "fap yaounde": "إف إيه بي ياوندي", "coton sport": "كوتون سبورت", "coton sport garoua": "كوتون سبورت", "canon yaounde": "كانون ياوندي",
    "union douala": "يونيون دوالا", "bamboutos": "بامبوتوس", "unisport bafang": "يونيسبورت", "ac leopards": "ليوبارد",
    "ac leopards dolisie": "ليوبارد", "amazulu fc": "أمازولو", "cape town city": "كيب تاون سيتي", "cape town spurs": "كيب تاون سبيرز",
    "chippa united": "شيبا يونايتد", "golden arrows": "غولدن أروز", "lamontville golden arrows": "غولدن أروز", "magesi": "ماجيسي",
    "richards bay": "ريتشاردز باي", "royal am": "رويال إيه إم", "polokwane city": "بولوكواني سيتي", "marumo gallants": "ماروما غالانتس",
    "swallows": "سوالوز", "moroka swallows": "موروكا سوالوز", "tp mazembe lubumbashi": "مازيمبي", "daring club motema pembe": "موتيما بيمبي",
    "as maniema union": "مانييما يونيون", "sc villa": "فيلا", "kcca": "كمبالا سيتي", "kcca fc": "كمبالا سيتي",
    "vipers sc": "فايبرز", "express fc": "إكسبرس", "gor mahia": "غور ماهيا", "afc leopards": "ليوبارد",
    "tusker": "تاسكر", "kakamega homeboyz": "كاكاميغا", "rayon sports fc": "رايون سبورتس", "apr fc": "إيه بي آر",
    "al hilal juba": "الهلال جوبا", "atletico petroleos": "بترو أتلتيكو", "primeiro de agosto": "بريميرو دي أغوستو", "1 de agosto": "بريميرو دي أغوستو",
    "interclube": "إنتر كلوبي", "sagrada esperanca luanda": "ساغرادا إسبرانسا", "nacional benguela": "ناسيونال بنغيلا", "desportivo da huila": "ديبورتيفو دا هويلا",
    "black leopards": "بلاك ليوبارد", "fc platinum": "بلاتينوم", "dynamos harare": "دينامو هراري", "caps united": "كابس يونايتد",
    "highlanders": "هايلاندرز", "ngezi platinum stars": "نغيزي بلاتينوم", "zanaco": "زاناكو", "nkana": "نكانا",
    "mufulira wanderers": "موفوليرا", "red arrows": "ريد أرووز", "nkwazi": "نكوازي", "kabwe warriors": "كابوي ووريورز",
    "costa do sol": "كوستا دو سول", "ferroviario de maputo": "فيروفيارو مابوتو", "ferroviario maputo": "فيروفيارو مابوتو", "liga desportiva": "ليغا ديسبورتيفا",
    "black bulls maputo": "بلاك بولز", "uniao do songo": "يونياو دو سونغو", "mighty wanderers": "مايتي واندررز", "silver strikers": "سيلفر ستريكرز",
    "big bullets": "بيغ بوليتس", "as douanes": "الجمارك", "asc jaraaf": "جارافو", "jaraaf": "جارافو",
    "generation foot": "جينيراسيون فوت", "teungueth fc": "تينغيث", "casa sports": "كازا سبورتس", "as pikine": "بيكين",
    "diambars": "ديامبارس", "stade malien bamako": "ستاد مالي", "djoliba ac": "جولييبا", "as real bamako": "ريال باماكو",
    "real bamako": "ريال باماكو", "as bakaridjan": "باكاريدجان", "usfas": "يو إس إف إيه إس", "us ouagadougou": "واغادوغو",
    "asfa yennenga": "يينينغا", "rail club du kadiogo": "رايل كلوب", "rahimo fc": "راحيمو", "etoile filante": "إتوال فيلانت",
    "as fortior": "فورتيور", "niger": "النيجر", "as nigelec": "نيجيليك", "buffles du borgou": "بوفل دو بورغو",
    "dragons de l oueme": "دراغونز", "al hilal club": "الهلال", "vissel kobe": "فيسيل كوبي", "yokohama f marinos": "يوكوهاما إف مارينوس",
    "kawasaki frontale": "كاواساكي فرونتال", "urawa red diamonds": "أوراوا ريد دياموندز", "urawa reds": "أوراوا ريد دياموندز", "kashima antlers": "كاشيما أنتلرز",
    "gamba osaka": "غامبا أوساكا", "cerezo osaka": "سيريزو أوساكا", "sanfrecce hiroshima": "سانفريتشي هيروشيما", "nagoya grampus": "ناغويا غرامبوس",
    "fc tokyo": "إف سي طوكيو", "kashiwa reysol": "كاشيوا ريسول", "shimizu s pulse": "شيميزو إس بالس", "avispa fukuoka": "أفيسبا فوكوكا",
    "machida zelvia": "ماتشيدا زيلفيا", "sagan tosu": "ساغان توسو", "albirex niigata": "ألبيريكس نيغاتا", "jubilo iwata": "جوبيلو إيواتا",
    "consadole sapporo": "كونسادولي سابورو", "ulsan hd": "أولسان إتش دي", "ulsan hyundai": "أولسان هيونداي", "jeonbuk hyundai motors": "جونبوك هيونداي",
    "jeonbuk motors": "جونبوك هيونداي", "pohang steelers": "بوهانغ ستيلرز", "fc seoul": "إف سي سيول", "suwon samsung bluewings": "سوون سامسونغ",
    "suwon fc": "سوون إف سي", "daegu fc": "دايغو", "incheon united": "إنتشون يونايتد", "gangwon fc": "غانغوون",
    "jeju united": "جيجو يونايتد", "gwangju fc": "غوانغجو", "daejeon hana citizen": "دايجون هانا سيتيزن", "shanghai port": "شنغهاي بورت",
    "shanghai shenhua": "شنغهاي شينخوا", "beijing guoan": "بكين غوان", "shandong taishan": "شاندونغ تايشان", "shandong luneng": "شاندونغ تايشان",
    "chengdu rongcheng": "تشنغدو رونغتشنغ", "zhejiang": "تشجيانغ", "tianjin jinmen tiger": "تيانجين جينمن تايغر", "guangzhou fc": "غوانزو",
    "guangzhou evergrande": "غوانزو إيفرغراندي", "wuhan three towns": "ووهان ثري تاونز", "buriram united": "بوريرام يونايتد", "bangkok united": "بانكوك يونايتد",
    "muangthong united": "موانغ ثونغ يونايتد", "port fc": "بورت", "johor darul ta zim": "جوهور دار التعظيم", "johor darul takzim": "جوهور دار التعظيم",
    "selangor": "سيلانغور", "bali united": "بالي يونايتد", "persib bandung": "برسيب باندونغ", "persija jakarta": "برسيجا جاكرتا",
    "viettel": "فيتيل", "hanoi fc": "هانوي", "becamex binh duong": "بينه دونغ", "hai phong": "هايفونغ",
    "tampines rovers": "تامبينز روفرز", "lion city sailors": "ليون سيتي سيلورز", "albirex niigata singapore": "ألبيريكس نيغاتا سنغافورة", "mohun bagan": "موهون باغان",
    "mohun bagan super giant": "موهون باغان", "east bengal": "إيست بنغال", "mumbai city": "مومباي سيتي", "fc goa": "إف سي غوا",
    "bengaluru fc": "بنغالورو", "kerala blasters": "كيرالا بلاسترز", "odisha fc": "أوديشا", "chennaiyin": "تشيناين",
    "jamshedpur": "جامشيدبور", "northeast united": "نورث إيست يونايتد", "persepolis": "برسبوليس", "esteghlal": "استقلال طهران",
    "sepahan": "سباهان", "tractor": "تراكتور", "tractor sazi": "تراكتور", "foolad": "فولاد",
    "foolad khuzestan": "فولاد خوزستان", "gol gohar": "غول غوهر", "malavan": "ملوان", "nassaji mazandaran": "نساجي مازندران",
    "paykan": "بيكان", "aluminium arak": "ألومنيوم آراك", "shams azar": "شمس آذر", "melbourne city": "ملبورن سيتي",
    "melbourne victory": "ملبورن فيكتوري", "sydney fc": "سيدني", "western sydney wanderers": "وسترن سيدني واندرارز", "central coast mariners": "سنترال كوست مارينرز",
    "brisbane roar": "بريسبان رور", "perth glory": "بيرث غلوري", "adelaide united": "أديلايد يونايتد", "newcastle jets": "نيوكاسل جتس",
    "wellington phoenix": "ويلينغتون فينيكس", "macarthur fc": "ماكارثر", "western united": "وسترن يونايتد", "auckland fc": "أوكلاند",
    "club america": "أمريكا المكسيكي", "america": "أمريكا المكسيكي", "chivas": "تشيفاس", "guadalajara": "تشيفاس",
    "cruz azul": "كروز أزول", "pumas unam": "بوماس", "unam pumas": "بوماس", "tigres uanl": "تيغريس",
    "tigres": "تيغريس", "monterrey": "مونتيري", "cf monterrey": "مونتيري", "toluca": "تولوكا",
    "pachuca": "باتشوكا", "club leon": "ليون المكسيكي", "santos laguna": "سانتوس لاغونا", "necaxa": "نيكاكسا",
    "queretaro": "كيريتارو", "club tijuana": "تيخوانا", "tijuana": "تيخوانا", "xolos": "تيخوانا",
    "puebla": "بويبلا", "mazatlan": "مازاتلان", "juarez": "خواريز", "fc juarez": "خواريز",
    "atletico san luis": "أتلتيكو سان لويس", "deportivo saprissa": "سابريسا", "saprissa": "سابريسا", "alajuelense": "ألاخويلينسي",
    "herediano": "هيريديانو", "cd olimpia": "أوليمبيا", "motagua": "موتاغوا", "real espana": "ريال إسبانيا",
    "comunicaciones": "كوميونيكاسيونيس", "arabe unido": "عربي يونيدو", "violette ac": "فيوليت", "portmore united": "بورتمور يونايتد",
    "sao paulo fc": "ساو باولو", "sc corinthians": "كورينثيانز", "sport recife": "سبورت ريسيفي", "ceara": "سيارا",
    "goias": "غويانيا", "athletico paranaense": "أتلتيكو باراناينسي", "athletico pr": "أتلتيكو باراناينسي", "coritiba": "كوريتيبا",
    "red bull bragantino": "ريد بول براغانتينو", "bragantino": "براغانتينو", "juventude": "جوفنتودي", "mirassol": "ميراسول",
    "america mg": "أمريكا مينيرو", "chapecoense": "شابيكوينسي", "criciuma": "كريسيوما", "cuiaba": "كويابا",
    "paysandu": "بايساندو", "newell s old boys": "نيولز أولد بويز", "newells old boys": "نيولز أولد بويز", "rosario central": "روزاريو سنترال",
    "argentinos juniors": "أرخنتينوس جونيورز", "banfield": "بانفيلد", "huracan": "أوراكان", "godoy cruz": "غودوي كروز",
    "defensa y justicia": "ديفينسا إي خوستيسيا", "belgrano": "بيلغرانو", "colon": "كولون", "union santa fe": "يونيون سانتا في",
    "gimnasia la plata": "خيمناسيا لا بلاتا", "tigre": "تيغري", "platense": "بلاتينسي", "instituto": "إنستيتوتو",
    "central cordoba": "سنترال كوردوبا", "sarmiento": "سارمينتو", "barracas central": "باراكاس سنترال", "atletico tucuman": "أتلتيكو توكومان",
    "velez": "فيليز سارسفيلد", "deportivo cali": "ديبورتيفو كالي", "atletico nacional": "أتلتيكو ناسيونال", "millonarios": "ميلوناريوس",
    "america de cali": "أمريكا دي كالي", "junior barranquilla": "خونيور", "independiente santa fe": "إندبندينتي سانتا في", "deportes tolima": "ديبورتيس توليما",
    "once caldas": "أونس كالداس", "alianza lima": "أليانزا ليما", "universitario": "يونيفرسيتاريو", "sporting cristal": "سبورتينغ كريستال",
    "melgar": "ميلغار", "cienciano": "سيينسيانو", "cerro porteno": "سيرو بورتينيو", "guarani": "غواراني",
    "olimpia asuncion": "أوليمبيا أسونسيون", "nacional asuncion": "ناسيونال أسونسيون", "bolivar": "بوليفار", "the strongest": "ذا ستورنغست",
    "always ready": "أولويز ريدي", "barcelona guayaquil": "برشلونة غواياكيل", "emelec": "إيميليك", "ldu quito": "ليغا دي كيتو",
    "aucas": "أوكاس", "deportivo cuenca": "ديبورتيفو كوينكا", "caracas": "كاراكاس", "caracas fc": "كاراكاس",
    "deportivo tachira": "ديبورتيفو تاتشيرا", "liverpool montevideo": "ليفربول مونتيفيديو", "defensor sporting": "ديفنسور سبورتينغ", "danubio": "دانوبيو",
    "wanderers montevideo": "واندررز مونتيفيديو", "cerro largo": "سيرو لارغو", "huachipato": "واتشيباتو", "palestino": "بالستينو",
    "cobresal": "كوبريسال", "o higgins": "أوهيغينز", "universidad catolica": "أونيفرسيداد كاتوليكا", "everton de vina del mar": "إيفرتون فينيا ديل مار",
    "union espanola": "يونيون إسبانيولا", "chicago fire": "شيكاغو فاير", "nashville sc": "ناشفيل", "sporting kansas city": "سبورتنغ كانساس سيتي",
    "real salt lake": "ريال سولت ليك", "colorado rapids": "كولورادو رابيدز", "houston dynamo": "هيوستن دينامو", "dallas": "إف سي دالاس",
    "fc dallas": "إف سي دالاس", "minnesota united": "مينيسوتا يونايتد", "san jose earthquakes": "سان خوسيه إيرثكويكس", "vancouver whitecaps": "فانكوفر وايتكابس",
    "cf montreal": "مونتريال", "toronto fc": "تورونتو إف سي", "new england revolution": "نيو إنغلاند ريفولوشن", "dc united": "دي سي يونايتد",
    "st louis city": "سانت لويس سيتي", "san diego fc": "سان دييغو", "afghanistan": "أفغانستان", "albania": "ألبانيا",
    "algeria": "الجزائر", "andorra": "أندورا", "angola": "أنغولا", "antigua and barbuda": "أنتيغوا وباربودا",
    "argentina": "الأرجنتين", "armenia": "أرمينيا", "aruba": "أروبا", "australia": "أستراليا",
    "austria": "النمسا", "azerbaijan": "أذربيجان", "bahamas": "جزر البهاما", "bahrain": "البحرين",
    "bangladesh": "بنغلاديش", "barbados": "بربادوس", "belarus": "بيلاروسيا", "belgium": "بلجيكا",
    "belize": "بليز", "benin": "بنين", "bermuda": "برمودا", "bhutan": "بوتان",
    "bolivia": "بوليفيا", "bosnia and herzegovina": "البوسنة والهرسك", "bosnia herzegovina": "البوسنة والهرسك", "bosnia": "البوسنة والهرسك",
    "botswana": "بوتسوانا", "brazil": "البرازيل", "brunei": "بروناي", "bulgaria": "بلغاريا",
    "burkina faso": "بوركينا فاسو", "burundi": "بوروندي", "cambodia": "كمبوديا", "cameroon": "الكاميرون",
    "canada": "كندا", "cape verde": "الرأس الأخضر", "cape verde islands": "الرأس الأخضر", "cabo verde": "الرأس الأخضر",
    "central african republic": "أفريقيا الوسطى", "chad": "تشاد", "chile": "تشيلي", "china": "الصين",
    "china pr": "الصين", "chinese taipei": "تايبيه الصينية", "taiwan": "تايوان", "colombia": "كولومبيا",
    "comoros": "جزر القمر", "congo": "الكونغو", "congo dr": "الكونغو الديمقراطية", "dr congo": "الكونغو الديمقراطية",
    "democratic republic of the congo": "الكونغو الديمقراطية", "costa rica": "كوستاريكا", "cote d ivoire": "كوت ديفوار", "ivory coast": "كوت ديفوار",
    "croatia": "كرواتيا", "cuba": "كوبا", "curacao": "كوراساو", "cyprus": "قبرص",
    "czech republic": "التشيك", "czechia": "التشيك", "denmark": "الدنمارك", "djibouti": "جيبوتي",
    "dominica": "دومينيكا", "dominican republic": "جمهورية الدومينيكان", "ecuador": "الإكوادور", "egypt": "مصر",
    "el salvador": "السلفادور", "england": "إنجلترا", "equatorial guinea": "غينيا الاستوائية", "eritrea": "إريتريا",
    "estonia": "إستونيا", "eswatini": "إسواتيني", "swaziland": "إسواتيني", "ethiopia": "إثيوبيا",
    "faroe islands": "جزر فارو", "fiji": "فيجي", "finland": "فنلندا", "france": "فرنسا",
    "gabon": "الغابون", "gambia": "غامبيا", "the gambia": "غامبيا", "georgia": "جورجيا",
    "germany": "ألمانيا", "ghana": "غانا", "gibraltar": "جبل طارق", "greece": "اليونان",
    "grenada": "غرينادا", "guadeloupe": "غوادلوب", "guam": "غوام", "guatemala": "غواتيمالا",
    "guinea": "غينيا", "guinea bissau": "غينيا بيساو", "guyana": "غيانا", "haiti": "هايتي",
    "honduras": "هندوراس", "hong kong": "هونغ كونغ", "hungary": "المجر", "iceland": "آيسلندا",
    "india": "الهند", "indonesia": "إندونيسيا", "iran": "إيران", "ir iran": "إيران",
    "iraq": "العراق", "ireland": "أيرلندا", "republic of ireland": "أيرلندا", "israel": "إسرائيل",
    "italy": "إيطاليا", "jamaica": "جامايكا", "japan": "اليابان", "jordan": "الأردن",
    "kazakhstan": "كازاخستان", "kenya": "كينيا", "kosovo": "كوسوفو", "kuwait": "الكويت",
    "kyrgyzstan": "قيرغيزستان", "kyrgyz republic": "قيرغيزستان", "laos": "لاوس", "latvia": "لاتفيا",
    "lebanon": "لبنان", "lesotho": "ليسوتو", "liberia": "ليبيريا", "libya": "ليبيا",
    "liechtenstein": "ليختنشتاين", "lithuania": "ليتوانيا", "luxembourg": "لوكسمبورغ", "macao": "ماكاو",
    "macau": "ماكاو", "madagascar": "مدغشقر", "malawi": "مالاوي", "malaysia": "ماليزيا",
    "maldives": "جزر المالديف", "mali": "مالي", "malta": "مالطا", "martinique": "مارتينيك",
    "mauritania": "موريتانيا", "mauritius": "موريشيوس", "mexico": "المكسيك", "moldova": "مولدوفا",
    "mongolia": "منغوليا", "montenegro": "الجبل الأسود", "montserrat": "مونتسيرات", "morocco": "المغرب",
    "mozambique": "موزمبيق", "myanmar": "ميانمار", "namibia": "ناميبيا", "nepal": "نيبال",
    "netherlands": "هولندا", "holland": "هولندا", "new caledonia": "كاليدونيا الجديدة", "new zealand": "نيوزيلندا",
    "nicaragua": "نيكاراغوا", "nigeria": "نيجيريا", "north korea": "كوريا الشمالية", "korea dpr": "كوريا الشمالية",
    "north macedonia": "مقدونيا الشمالية", "macedonia": "مقدونيا الشمالية", "northern ireland": "أيرلندا الشمالية", "norway": "النرويج",
    "oman": "عُمان", "pakistan": "باكستان", "palestine": "فلسطين", "panama": "بنما",
    "papua new guinea": "بابوا غينيا الجديدة", "paraguay": "باراغواي", "peru": "بيرو", "philippines": "الفلبين",
    "poland": "بولندا", "portugal": "البرتغال", "puerto rico": "بورتوريكو", "qatar": "قطر",
    "romania": "رومانيا", "russia": "روسيا", "rwanda": "رواندا", "saint kitts and nevis": "سانت كيتس ونيفيس",
    "st kitts and nevis": "سانت كيتس ونيفيس", "saint lucia": "سانت لوسيا", "st lucia": "سانت لوسيا", "saint vincent and the grenadines": "سانت فنسنت والغرينادين",
    "samoa": "ساموا", "san marino": "سان مارينو", "sao tome and principe": "ساو تومي وبرينسيبي", "saudi arabia": "السعودية",
    "scotland": "اسكتلندا", "senegal": "السنغال", "serbia": "صربيا", "seychelles": "سيشل",
    "sierra leone": "سيراليون", "singapore": "سنغافورة", "slovakia": "سلوفاكيا", "slovenia": "سلوفينيا",
    "solomon islands": "جزر سليمان", "somalia": "الصومال", "south africa": "جنوب أفريقيا", "south korea": "كوريا الجنوبية",
    "korea republic": "كوريا الجنوبية", "south sudan": "جنوب السودان", "spain": "إسبانيا", "sri lanka": "سريلانكا",
    "sudan": "السودان", "suriname": "سورينام", "sweden": "السويد", "switzerland": "سويسرا",
    "syria": "سوريا", "tahiti": "تاهيتي", "tajikistan": "طاجيكستان", "tanzania": "تنزانيا",
    "thailand": "تايلاند", "timor leste": "تيمور الشرقية", "togo": "توغو", "tonga": "تونغا",
    "trinidad and tobago": "ترينيداد وتوباغو", "tunisia": "تونس", "turkey": "تركيا", "turkiye": "تركيا",
    "turkmenistan": "تركمانستان", "uganda": "أوغندا", "ukraine": "أوكرانيا", "united arab emirates": "الإمارات",
    "uae": "الإمارات", "united states": "الولايات المتحدة", "usa": "الولايات المتحدة", "uruguay": "الأوروغواي",
    "uzbekistan": "أوزبكستان", "vanuatu": "فانواتو", "venezuela": "فنزويلا", "vietnam": "فيتنام",
    "wales": "ويلز", "yemen": "اليمن", "zambia": "زامبيا", "zimbabwe": "زيمبابوي",
    "french guiana": "غويانا الفرنسية", "reunion": "ريونيون", "zanzibar": "زنجبار",
  };

  const STRIP = new Set(['fc', 'cf', 'sc', 'afc', 'fk', 'sk', 'club', 'the']);
  const key = (name) => String(name ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/).filter((w) => w && !STRIP.has(w)).join(' ');

  // نعيد بناء القواميس بمفاتيح موحّدة (تُحذف fc/club.. من المفتاح) حتى تتطابق مع key() دائمًا
  const normMap = (obj) => { const m = new Map(); Object.entries(obj).forEach(([k, v]) => { const nk = key(k); if (nk && !m.has(nk)) m.set(nk, v); }); return m; };
  const TM = normMap(TEAMS);
  normMap(EXTRA).forEach((v, k) => { if (!TM.has(k)) TM.set(k, v); });
  const PM = normMap(PLAYERS);
  const FIX = { 'trezeguet': 'تريزيجيه', 'mahmoud hassan trezeguet': 'محمود حسن تريزيجيه', 'ali maher': 'علي ماهر', 'hossam hassan': 'حسام حسن', 'zizo': 'زيزو', 'ahmed sayed zizo': 'زيزو', 'mohanad lasheen': 'مهند لاشين', 'nasser maher': 'ناصر ماهر', 'mohamed hany': 'محمد هاني',
    'ahmed fotouh': 'أحمد فتوح', 'ahmed fatouh': 'أحمد فتوح', 'hossam abdelmaguid': 'حسام عبد المجيد', 'ramy rabia': 'رامي ربيعة', 'mostafa shobeir': 'مصطفى شوبير', 'mahmoud saber': 'محمود صابر', 'marwan attia': 'مروان عطية', 'hamza abdelkarim': 'حمزة عبد الكريم', 'ibrahim adel': 'إبراهيم عادل' };
  Object.entries(FIX).forEach(([k, v]) => PM.set(key(k), v));

  /* ---------- كتابة تقريبية بالعربي لأي اسم غير موجود في القاموس ---------- */
  const WORDS = {
    real: 'ريال', united: 'يونايتد', city: 'سيتي', town: 'تاون', rovers: 'روفرز', wanderers: 'واندررز', athletic: 'أتلتيك', atletico: 'أتلتيكو', sporting: 'سبورتينغ', racing: 'راسينغ', deportivo: 'ديبورتيفو',
    olympique: 'أولمبيك', olympic: 'أولمبيك', sport: 'سبورت', sports: 'سبورتس', dynamo: 'دينامو', inter: 'إنتر', stade: 'ستاد', union: 'يونيون', albion: 'ألبيون', county: 'كاونتي', rangers: 'رينجرز', athletics: 'أتلتيكس',
    charles: 'تشارلز', john: 'جون', james: 'جيمس', george: 'جورج', michael: 'مايكل', peter: 'بيتر', paul: 'بول', patrick: 'باتريك', joseph: 'جوزيف', daniel: 'دانيال', david: 'ديفيد', samuel: 'صامويل', emmanuel: 'إيمانويل', thomas: 'توماس', william: 'ويليام', richard: 'ريتشارد', robert: 'روبرت', stephen: 'ستيفن', steven: 'ستيفن', francis: 'فرانسيس', frank: 'فرانك', isaac: 'إسحاق', gift: 'غيفت', blessings: 'بليسينغز', precious: 'بريشوس', lucky: 'لاكي',
    abdel: 'عبد', abdul: 'عبد', abdal: 'عبد', abd: 'عبد', abou: 'أبو', abu: 'أبو', aboul: 'أبو', de: 'دي', del: 'ديل', da: 'دا', do: 'دو', dos: 'دوس', van: 'فان', von: 'فون', di: 'دي', la: 'لا', le: 'لو', el: 'ال', al: 'ال', women: '(سيدات)', w: '(سيدات)', ii: 'الثاني', b: 'ب',
    u17: 'تحت 17', u18: 'تحت 18', u19: 'تحت 19', u20: 'تحت 20', u21: 'تحت 21', u23: 'تحت 23',
  };
  const INITIAL = { a: 'أ', b: 'ب', c: 'س', d: 'د', e: 'إ', f: 'ف', g: 'ج', h: 'هـ', i: 'إ', j: 'ج', k: 'ك', l: 'ل', m: 'م', n: 'ن', o: 'أ', p: 'ب', q: 'ك', r: 'ر', s: 'س', t: 'ت', u: 'أ', v: 'ف', w: 'و', x: 'إ', y: 'ي', z: 'ز' };
  const CONS = { b: 'ب', d: 'د', f: 'ف', h: 'ه', k: 'ك', l: 'ل', m: 'م', n: 'ن', p: 'ب', r: 'ر', s: 'س', t: 'ت', v: 'ف', w: 'و', z: 'ز', q: 'ك', x: 'كس', j: 'ج' };
  const VOW = 'aeiou';

  /* ---------- أسماء عربية شائعة: بدل الكتابة الصوتية الغلط (Mohamed → محمد وليس موهاميد) ---------- */
  const ARN = {};
  const arn = (ar, ...ens) => ens.forEach((e) => { ARN[e] = ar; });
  arn('محمد', 'mohamed', 'mohammed', 'mohamad', 'mohammad', 'muhammad', 'muhammed', 'mohamud', 'mohd', 'mhmd');
  arn('أحمد', 'ahmed', 'ahmad', 'ahmet'); arn('محمود', 'mahmoud', 'mahmud', 'mahmood'); arn('مصطفى', 'mostafa', 'mustafa', 'moustafa', 'mostapha');
  arn('حسام', 'hossam', 'hosam', 'houssam', 'husam'); arn('حسن', 'hassan', 'hasan', 'hosni'); arn('حسين', 'hussein', 'hussain', 'hosein', 'houssein', 'husain');
  arn('حمزة', 'hamza', 'hamzah'); arn('مروان', 'marwan', 'merwan'); arn('رامي', 'ramy', 'rami'); arn('كريم', 'karim', 'kareem'); arn('عمر', 'omar', 'umar');
  arn('يوسف', 'youssef', 'yousef', 'yusuf', 'youssouf', 'yussef', 'yousseph'); arn('خالد', 'khaled', 'khalid'); arn('طارق', 'tarek', 'tariq', 'tarik'); arn('وليد', 'walid', 'waleed');
  arn('عمرو', 'amr', 'amro', 'amru'); arn('شريف', 'sherif', 'sherief', 'sharif'); arn('عصام', 'essam', 'issam'); arn('عماد', 'emad', 'imad'); arn('حازم', 'hazem', 'hazim');
  arn('هاني', 'hany', 'hani', 'hanny'); arn('إسلام', 'islam'); arn('أيمن', 'ayman'); arn('وائل', 'wael'); arn('سامي', 'sami'); arn('سامح', 'sameh'); arn('سعد', 'saad', 'saed');
  arn('سعيد', 'said', 'saeed', 'saied'); arn('سالم', 'salem'); arn('صالح', 'saleh'); arn('فيصل', 'faisal', 'faysal', 'feisal'); arn('فهد', 'fahad', 'fahd'); arn('سلطان', 'sultan');
  arn('ناصر', 'nasser', 'naser', 'nasir', 'nasr'); arn('ماهر', 'maher', 'mahir'); arn('مهند', 'mohanad', 'mohannad', 'muhannad'); arn('علي', 'ali', 'aly'); arn('إبراهيم', 'ibrahim', 'ebrahim', 'brahim');
  arn('إسماعيل', 'ismail', 'ismael', 'esmail', 'ismaeel'); arn('خليل', 'khalil'); arn('نبيل', 'nabil'); arn('بلال', 'bilal'); arn('أمين', 'amine', 'amin'); arn('ياسين', 'yassine', 'yasin', 'yassin');
  arn('زكريا', 'zakaria', 'zakariya', 'zakaryia'); arn('إدريس', 'idris', 'driss'); arn('عبدالله', 'abdullah', 'abdallah', 'abdulla'); arn('رياض', 'riyad', 'riyadh', 'riad');
  arn('أشرف', 'achraf', 'ashraf'); arn('حكيم', 'hakim'); arn('زياش', 'ziyech'); arn('محرز', 'mahrez'); arn('صلاح', 'salah', 'salaah'); arn('عادل', 'adel'); arn('سيد', 'sayed', 'sayyid', 'sayid');
  arn('لاشين', 'lasheen', 'lashin'); arn('فتوح', 'fotouh', 'fatouh', 'fotoh', 'fatouh'); arn('ربيعة', 'rabia', 'rabie', 'rabea'); arn('صابر', 'saber', 'sabir', 'sabr'); arn('عطية', 'attia', 'atia', 'atiyah', 'attiya');
  arn('عاشور', 'ashour', 'ashur'); arn('توفيق', 'tawfik', 'tawfiq', 'taufik'); arn('فتحي', 'fathy', 'fathi'); arn('جابر', 'gaber', 'gabr', 'jaber'); arn('غزال', 'ghazal'); arn('النني', 'elneny');
  arn('حجازي', 'hegazi', 'hegazy', 'higazi'); arn('الشناوي', 'shenawy', 'shennawy'); arn('شوبير', 'shobeir', 'shobier', 'shoubir', 'shobair'); arn('زيزو', 'zizo'); arn('تريزيجيه', 'trezeguet', 'trézéguet');
  arn('مرموش', 'marmoush', 'marmush'); arn('إمام', 'emam', 'imam'); arn('حمدي', 'hamdi', 'hamdy'); arn('أكرم', 'akram'); arn('رمضان', 'ramadan'); arn('صبحي', 'sobhi', 'sobhy'); arn('عبد الله', 'abdallah');
  arn('مجدي', 'magdy', 'majdi'); arn('ماجد', 'maged', 'majed', 'majid'); arn('جمال', 'gamal', 'jamal'); arn('كمال', 'kamal'); arn('جلال', 'galal', 'jalal'); arn('منصور', 'mansour', 'mansur');
  arn('عصمت', 'esmat'); arn('رضا', 'reda', 'redha', 'rida'); arn('عوض', 'awad'); arn('رفعت', 'refaat', 'rifaat'); arn('شحاتة', 'shehata', 'chehata'); arn('بدر', 'badr', 'bader');
  arn('سليم', 'selim', 'salim', 'slim'); arn('مراد', 'mourad', 'murad'); arn('نادر', 'nader'); arn('عمّار', 'ammar'); arn('باسم', 'basem', 'bassem'); arn('بسام', 'bassam');
  const ABD = [['المجيد', 'maguid|majeed|maged|magid|mejid'], ['الكريم', 'karim|kareem'], ['الرحمن', 'rahman|rahmane|rehman'], ['العزيز', 'aziz|azeez'], ['الحميد', 'hamid|hameed'], ['السلام', 'salam|salaam'],
    ['الرازق', 'razek|razzaq|razeq|razik'], ['الفتاح', 'fattah|fatah'], ['اللطيف', 'latif|lateef'], ['المنعم', 'monem|moneim|moniem|monaem|mounim'], ['الوهاب', 'wahab|wahhab'], ['الحليم', 'halim|haleem'],
    ['الغني', 'ghani|ghany'], ['القادر', 'qader|kader|kadir|gader'], ['الله', 'allah|llah'], ['الناصر', 'nasser|naser'], ['الهادي', 'hadi|hady'], ['الجواد', 'gawad|jawad'], ['الستار', 'sattar|satar'], ['الحفيظ', 'hafiz|hafeez'], ['الظاهر', 'zaher|zahir'], ['الغفار', 'ghaffar|ghafar']];
  const arnWord = (w) => {
    if (ARN[w]) return ARN[w];
    const m = w.match(/^(abdel|abdul|abdal|abdol|abd)([a-z]{3,})$/);
    if (m) { const hit = ABD.find(([, re]) => new RegExp(`^(${re})$`).test(m[2])); if (hit) return `عبد ${hit[0]}`; }
    return '';
  };
  const translitWord = (w) => {
    if (WORDS[w]) return WORDS[w];
    { const a = arnWord(w); if (a) return a; }
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
    return original; // مش معروف: نعرض الاسم الإنجليزي الصحيح بدل ترجمة تقريبية غلط، ويتجمّع للأدمن يترجمه
  };

  const unknownPlayers = new Set();
  // اللاعب/المدرب: الاسم كاملًا، ثم اللقب (آخر كلمة)، وإلا كتابة تقريبية بالعربي
  const player = (name) => {
    const original = String(name ?? '').trim();
    if (!original) return '';
    if (!/[a-z]/i.test(original)) return original; // مكتوب بالعربي أصلًا
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

  const known = (name) => { const k = key(name); return TM.has(k) || remote.team.has(k); };
  window.YR_NAMES = { known, report: () => reportUnknown(), entries: () => [...TM].map(([en, ar]) => [en, ar]), team: teamFinal, player: playerFinal, translit, ready, unknown: () => ({ teams: [...unknown].sort(), players: [...unknownPlayers].sort() }) };
  /* الفرق المجهولة بتتبعت (اسمها بس) لجدول name_unknown علشان الأدمن يترجمها من لوحة التحكم */
  const reportUnknown = async () => {
    try {
      await ready; const db = window.yrSupabase; if (!db || !/^(match|matches|team|index|)$/.test((location.pathname.split('/').pop() || '').replace(/\.html$/i, ''))) return;
      let sent = []; try { sent = JSON.parse(localStorage.getItem('yr-unk') || '[]'); } catch { sent = []; }
      const todo = [...unknown].filter((n) => !known(n) && !sent.includes(n)).slice(0, 12);
      for (const n of todo) { const { error } = await db.rpc('report_unknown_name', { p_kind: 'team', p_en: n }); if (error) break; sent.push(n); }
      try { localStorage.setItem('yr-unk', JSON.stringify(sent.slice(-400))); } catch { /* اختياري */ }
    } catch { /* اختياري */ }
  };
  window.addEventListener('load', () => setTimeout(() => {
    reportUnknown();
    if (unknown.size) console.info('[يلا رياضة] فرق ظهرت بالإنجليزي (مش في القاموس):', [...unknown].sort());
  }, 2500));
})();
