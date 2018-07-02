export interface IRecipe {
    id?: string;
    name: string;
    tags: string[],
    thumbnail: string;
    description: string;
    time: number,
    ingredients: string[];
}

export const RECIPES: IRecipe[] = [
    {
        name: 'Fiskesuppe',
        tags: ['sunn', 'suppe', 'fisk'],
        thumbnail: 'https://images.matprat.no/6jqc6apn4m-jumbotron/large',
        description: 'Officia ad officia proident elit nulla ad aliquip Lorem aute ipsum anim cillum duis dolor.',
        time: 20,
        ingredients: [
            '200gr laks',
            '200gr hvit fisk',
            '2 stk gulrot',
            '1 dl erter',
            '2dl Melk',
            '1 dl fløte',
            '2ss hvetemel',
            'fersk gressløk'
        ]
    },
    {
        name: 'Laksewrap',
        tags: ['sunn', 'kjapp', 'fisk'],
        thumbnail: 'https://coop.no/globalassets/mega2/fiskerestauranten/laksewrap-barna-kan-lage-selv.jpg?preset=CoverTablet',
        description: 'Voluptate mollit duis magna ut enim minim anim et proident non sit magna.',
        time: 15,
        ingredients: [
            '400gr laks',
            '2stk vårløk',
            '1-2stk avokado',
            '½ agurk',
            '1stk hjertesalat',
            '1stk tomat',
            'Tzatziki',
            'Store wraps'
        ]
    },
    {
        name: 'Fiskewok med nudler',
        tags: ['fisk'],
        thumbnail: 'https://3iuka.no/contentassets/21cd71136f4142d48e2eb2f7616e8868/full_file_1401796840.jpg?width=830&height=680&transform=DownResizeMin',
        description: 'Occaecat est nisi sit laboris ut deserunt ad esse commodo aliquip.',
        time: 20,
        ingredients: [
            '200gr laks',
            '200gr hvit fisk',
            'Grønnsaksblanding',
            '2dl Creme Fraiche',
            'Nudler'
        ]
    },
    {
        name: 'Spaghetti Bolognese',
        tags: ['kjapp', 'kjøttdeig'],
        thumbnail: 'https://d1alt1wkdk73qo.cloudfront.net/images/guide/eb29be6ebec54c928b42da2f9ad62fed/640x478_ac.jpg',
        description: 'Occaecat aute mollit cupidatat veniam excepteur fugiat elit.',
        time: 15,
        ingredients: [
            '400gr karbonadedeig',
            '1stk løk',
            'Parmesan',
            'Spaghettisaus',
            'Pasta'
        ]
    },
    {
        name: 'Spaghetti Carbonara',
        tags: ['kos', 'bacon'],
        thumbnail: 'https://scm-assets.constant.co/scm/unilever/a6798e909fa57bfd19c3e7f00737e5d6/fc0d976d-c8ca-494e-9f45-641b0bc80c7f.jpg',
        description: 'Cillum ea ut sunt ullamco aliquip sit consectetur nulla dolor.',
        time: 20,
        ingredients: [
            'Bacon',
            'Løk',
            'Fløte',
            'Egg',
            'Parmesan',
            'Pasta'
        ]
    },
    {
        name: 'Fiskekaker og grønnsakspasta',
        tags: ['fisk', 'sunn', 'kjapp'],
        thumbnail: 'https://www.diabetes.no/globalassets/kosthold/oppskrifter/middag/fiskekaker-med-gronnsaksstrimler.jpg',
        description: 'Exercitation eiusmod veniam elit veniam nostrud officia proident reprehenderit in et nulla.',
        time: 15,
        ingredients: [
            'Fiskekaker',
            '1stk brokkoli',
            'Sprøstekt løk',
            'Grønnsakspasta'
        ]
    },
    {
        name: 'Tomatsuppe',
        tags: ['sunn', 'suppe'],
        thumbnail: 'https://images.matprat.no/7rm43h4pjs-jumbotron/large',
        description: 'Ex dolor et do excepteur.',
        time: 20,
        ingredients: [
            '4 egg',
            '1stk løk',
            '1boks hakkede tomater',
            '2ss tomatpure',
            '1stk rød chilli',
            '1stk grønnsaksbuljong',
            'makaroni',
            'fersk basilikum'
        ]
    },
    {
        name: 'Purre og potetsuppe',
        tags: ['sunn', 'suppe'],
        thumbnail: 'http://2.bp.blogspot.com/-sHJTowLmhNE/UJaPopJ_2xI/AAAAAAAAGXc/rck_TbQ71c4/s1600/purre%20potetsuppe.jpg',
        description: 'Eiusmod elit ut magna Lorem ad pariatur ullamco velit velit cupidatat quis adipisicing.',
        time: 20,
        ingredients: [
            '½ purreløk',
            '500gr poteter',
            '3fedd hvitløk',
            '2dl fløte',
            '1l kraft(kylling el.grønnsak)',
            'Bacon to taste'
        ]
    },
    {
        name: 'Blomkålsuppe',
        tags: ['sunn', 'suppe'],
        thumbnail: 'https://d3n3udvbogpuxv.cloudfront.net/ynyut8xpgy-Oppskrift',
        description: 'Velit labore ad labore dolor cillum veniam magna non dolor excepteur dolore.',
        time: 20,
        ingredients: [
            '1stk blomkål',
            '½ løk',
            '2stk vårløk',
            '2stk kyllingbuljong (terninger)',
            '2dl helmelk',
            '8dl vann',
            'Bacon to taste'
        ]
    },
    {
        name: 'Hamburger',
        tags: ['kjapp'],
        thumbnail: 'http://a57.foxnews.com/images.foxnews.com/content/fox-news/food-drink/2017/11/08/trumps-hamburger-sells-out-in-japan/_jcr_content/par/featured_image/media-0.img.jpg/931/524/1510187336113.jpg?ve=1&tl=1&text=big-top-image',
        description: 'Deserunt sint officia deserunt ex id eu aliquip qui.',
        time: 15,
        ingredients: [
            'Hamburger',
            'Salat',
            'Løk',
            'Tomat',
            'Cheddar',
            'Brød',
            'Saus: Majones, ketchup, eplecider vinegar, løkpulver, hvitløkspulver, paprikakrydder'
        ]
    },
    {
        name: 'Pølse med brød',
        tags: ['kjapp'],
        thumbnail: 'https://gfx.nrk.no/edlEY4ahm_5ehGiRnut8mA9fYgZAVMlBeJNC-JJzeWCw',
        description: 'Nisi fugiat voluptate veniam quis nisi aliquip consequat elit aliquip cupidatat sunt cillum.',
        time: 10,
        ingredients: [
            'Pølse',
            'Brød'
        ]
    },
    {
        name: 'Kjøttkaker i brun saus',
        tags: [],
        thumbnail: 'https://img.gfx.no/1503/1503269/original.956x390.jpg',
        description: 'Elit deserunt ea cillum id pariatur.',
        time: 30,
        ingredients: [
            'Kjøttkaker',
            'Potet',
            'Kål',
            'Gulrot',
            'Brunsaus',
            '2ss smør',
            '4dl helmelk',
            '2ss hvetemel'
        ]
    },
    {
        name: 'Kyllingsalat',
        tags: ['sunn', 'kylling'],
        thumbnail: 'https://img.gfx.no/1505/1505836/original.956x390.jpg',
        description: 'Dolore est reprehenderit tempor ullamco.',
        time: 20,
        ingredients: [
            'Kyllingfilet',
            '½ rødløk',
            '½ agurk',
            '1stk granateple',
            'salat',
            '2stk avokado',
            'fetaost',
            'spirer'
        ]
    },
    {
        name: 'Pannekaker',
        tags: ['kos'],
        thumbnail: 'https://www.dagbladet.no/mat/bilder/c/xl/1/5a4756cc-amerikanske-pannekaker-med-lonnesirup.jpg',
        description: 'Consectetur consequat commodo cupidatat consectetur aliqua tempor magna eiusmod.',
        time: 20,
        ingredients: [
            'Pannekaker',
            'Blåbærsyltetøy',
            'Bacon',
            'Sukker'
        ]
    },
    {
        name: 'Grøt',
        tags: ['kjapp'],
        thumbnail: 'https://imbo.vgc.no/users/godt/images/910bda158d494bfdb19775b604d66a00.jpg?t%5B0%5D=resize%3Awidth%3D980&t%5B1%5D=strip&t%5B2%5D=compress%3Alevel%3D75&t%5B3%5D=progressive&accessToken=836072f5825e2eccf123dc922ea92a0bca93e1f0e6da738edf758e3ed26be3e3',
        description: 'Culpa enim reprehenderit in magna occaecat fugiat laborum cupidatat enim sit.',
        time: 5,
        ingredients: [
            'Fjordlands go!'
        ],
    },

    {
        name: 'Eggerøre og spekemat',
        tags: ['sunn'],
        thumbnail: 'http://bloggfiler.no/annsenze.blogg.no/images/1864528-12-1402339611679.jpg',
        description: 'Sunt ea commodo labore aliqua veniam mollit velit eu cupidatat ut ad deserunt.',
        time: 10,
        ingredients: [
            'Egg',
            'Creme Fraiche',
            'Spekeskinke',
            'Fenalår',
            'Majones',
            'Rundstykker',
            'Fersk gressløk'
        ]
    },
    {
        name: 'Eggerøre og laks',
        tags: ['sunn', 'fisk', 'kjapp'],
        thumbnail: 'https://spiroslo.no/wp-content/uploads/2015/04/smorbrod_laks_eggerore.jpg',
        description: 'Velit anim ex sit voluptate sit et id deserunt aute excepteur pariatur irure incididunt.',
        time: 10,
        ingredients: [
            'Egg',
            'Creme Fraiche',
            'Laks',
            'Majones',
            'Rundstykker',
            'Fersk gressløk'
        ]
    },
    {
        name: 'Omelett med skinke',
        tags: ['kjapp'],
        thumbnail: 'https://suntoggodt.no/wp-content/uploads/2014/12/Omelett-med-ost-og-skinke.jpg',
        description: 'Id amet excepteur eiusmod veniam non nulla sit non in.',
        time: 15,
        ingredients: [
            '6 egg',
            'Skinke',
            'Paprika',
            'Revet ost'
        ]
    },
    {
        name: 'Kyllingfilet med linse- og potetmos',
        tags: ['sunn', 'kylling'],
        thumbnail: 'https://images.matprat.no/gpjnqe3y2n-jumbotron/large',
        description: 'Labore anim veniam Lorem officia Lorem duis magna dolore anim labore consequat occaecat exercitation duis.',
        time: 20,
        ingredients: [
            '4stk kyllingfileter',
            '400gr potet',
            '2stk gulrot',
            '50gr fersk spinat',
            '1boks hermetiske linser',
            '1dl melk',
            'Fersk persille'
        ]
    },
    {
        name: 'Fritatta aka. bondeomelett',
        tags: ['sunn'],
        thumbnail: 'http://www.kindercare.com/content-hub/-/media/contenthub/images/article-images/lets%20eat/breakfast/fancy%20made%20easy%207%20ways%20to%20get%20your%20frittata%20on_frittata%20in%20cast%20iron%20pan.jpg',
        description: 'Esse sunt cillum ad exercitation.',
        time: 20,
        ingredients: [
            '200gr skinke',
            '200gr fersk spinat',
            '4stk potet',
            '4stk egg',
            'revet hvitost',
            '1dl Creme Fraiche'
        ]
    },
    {
        name: 'Koteletter med “hot” kålsalat',
        tags: ['svin'],
        thumbnail: 'https://images.matprat.no/50e697850d2f831c07003033-jumbotron/large',
        description: 'Elit consectetur eiusmod do qui deserunt labore est eu nostrud do id.',
        time: 20,
        ingredients: [
            'Koteletter',
            'Hodekål',
            '1stk rødløk',
            '1stk rød chili',
            '1stk grønn chili',
            '2ts spisskummenfrø'
        ]
    },
    {
        name: 'Chili con carne',
        tags: ['kos'],
        thumbnail: 'https://tmbidigitalassetsazure.blob.core.windows.net/secure/RMS/attachments/37/1200x1200/exps2556_HWS2321910B05_02_1b_WEB.jpg',
        description: 'Proident deserunt proident est exercitation id eiusmod.',
        time: 30,
        ingredients: [
            'Karbonadedeig',
            'Kidneybønner',
            'Chilibønner',
            '1boks hakkede tomater',
            'Krydderblanding',
            'Cayennepepper',
            'Pepper',
            'Salt',
            'Ris, rundstykker eller nachochips'
        ]
    },
    {
        name: 'Kremet pastasalat med skinke',
        tags: ['svin'],
        thumbnail: 'https://imbo.vgc.no/users/godt/images/f57320e47727830f6d904ec3be1ff6a1.jpg?t%5B0%5D=resize%3Awidth%3D980&t%5B1%5D=strip&t%5B2%5D=compress%3Alevel%3D75&t%5B3%5D=progressive&accessToken=ce68c0cfa33c94a5dd5905872ac11ac853718219b5f30a196c8b05240760a12c',
        description: 'Consequat veniam nulla culpa ex in sit irure nostrud minim.',
        time: 30,
        ingredients: [
            'Skinke',
            'Avokado',
            'Vårløk',
            'Hvitløk',
            'Mais',
            'Sukkererter',
            'Paprika',
            'Pastaskruer',
            'Bacon to taste'

        ]
    },
    {
        name: 'Pizzasnurr',
        tags: ['kos'],
        thumbnail: 'http://www.goyforbarn.no/wp-content/uploads/2017/10/enkle_pizzasnurrer_til_barn-550x381.jpg',
        description: 'Fugiat veniam aliqua incididunt ex magna occaecat officia quis officia dolor Lorem pariatur veniam Lorem.',
        time: 45,
        ingredients: [
            '400g kjøttdeig',
            '1stk løk',
            'pizzasaus',
            'revet ost',
            'pizzadeig'

        ]
    }
];