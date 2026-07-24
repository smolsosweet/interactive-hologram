const PLANET_INFO = [
    {
        emoji: '☀️', color: '#FDB813',
        vi: {
            name: 'Mặt Trời', sub: 'Sun', type: 'Ngôi sao (Lùn vàng G2V)',
            stats: [{label: 'Đường kính', value: '1,392,700 km'}, {label: 'Khối lượng', value: '333,000× Trái Đất'}, {label: 'Nhiệt độ', value: '~5,500°C'}],
            desc: 'Mặt Trời là ngôi sao trung tâm hệ mặt trời, cách Trái Đất 150 triệu km. Cung cấp năng lượng duy trì sự sống.'
        },
        en: {
            name: 'Sun', sub: 'Mặt Trời', type: 'Yellow Dwarf Star (G2V)',
            stats: [{label: 'Diameter', value: '1,392,700 km'}, {label: 'Mass', value: '333,000× Earth'}, {label: 'Temperature', value: '~5,500°C'}],
            desc: 'The Sun is the star at the center of the Solar System, providing energy that sustains life on Earth.'
        },
        zh: {
            name: '太阳', sub: 'Sun', type: '黄矮星 (G2V)',
            stats: [{label: '直径', value: '1,392,700 km'}, {label: '质量', value: '333,000× 地球'}, {label: '表面温度', value: '~5,500°C'}],
            desc: '太阳是太阳系中心的恒星，距离地球1.5亿公里，为地球上的生命提供能量。'
        }
    },
    {
        emoji: '🔴', color: '#B0B0B0',
        vi: {
            name: 'Sao Thủy', sub: 'Mercury', type: 'Hành tinh đất đá',
            stats: [{label: 'Đường kính', value: '4,879 km'}, {label: 'Cách Mặt Trời', value: '57.9 triệu km'}, {label: 'Chu kỳ quỹ đạo', value: '88 ngày'}],
            desc: 'Sao Thủy là hành tinh nhỏ nhất và gần Mặt Trời nhất, với biên độ nhiệt cực kỳ khắc nghiệt.'
        },
        en: {
            name: 'Mercury', sub: 'Sao Thủy', type: 'Terrestrial Planet',
            stats: [{label: 'Diameter', value: '4,879 km'}, {label: 'Distance to Sun', value: '57.9M km'}, {label: 'Orbit Period', value: '88 days'}],
            desc: 'Mercury is the smallest planet and closest to the Sun, experiencing extreme temperature variations.'
        },
        zh: {
            name: '水星', sub: 'Mercury', type: '类地行星',
            stats: [{label: '直径', value: '4,879 km'}, {label: '距太阳', value: '5790万 km'}, {label: '公转周期', value: '88天'}],
            desc: '水星是太阳系中最小的行星，也是最靠近太阳的行星，温差极大。'
        }
    },
    {
        emoji: '🟡', color: '#E8C46A',
        vi: {
            name: 'Sao Kim', sub: 'Venus', type: 'Hành tinh đất đá',
            stats: [{label: 'Đường kính', value: '12,104 km'}, {label: 'Cách Mặt Trời', value: '108.2 triệu km'}, {label: 'Chu kỳ quỹ đạo', value: '225 ngày'}],
            desc: 'Sao Kim nóng nhất hệ mặt trời. Khí CO₂ dày đặc tạo hiệu ứng nhà kính cực mạnh.'
        },
        en: {
            name: 'Venus', sub: 'Sao Kim', type: 'Terrestrial Planet',
            stats: [{label: 'Diameter', value: '12,104 km'}, {label: 'Distance to Sun', value: '108.2M km'}, {label: 'Orbit Period', value: '225 days'}],
            desc: 'Venus is the hottest planet. Its thick CO₂ atmosphere creates a strong greenhouse effect.'
        },
        zh: {
            name: '金星', sub: 'Venus', type: '类地行星',
            stats: [{label: '直径', value: '12,104 km'}, {label: '距太阳', value: '1.08亿 km'}, {label: '公转周期', value: '225天'}],
            desc: '金星是太阳系中最热的行星。浓厚的二氧化碳大气层产生了极强的温室效应。'
        }
    },
    {
        emoji: '🔵', color: '#3CA3E0',
        vi: {
            name: 'Trái Đất', sub: 'Earth', type: 'Hành tinh đất đá',
            stats: [{label: 'Đường kính', value: '12,742 km'}, {label: 'Cách Mặt Trời', value: '149.6 triệu km'}, {label: 'Chu kỳ quỹ đạo', value: '365 ngày'}],
            desc: 'Trái Đất là hành tinh duy nhất có sự sống, với 71% bề mặt là nước.'
        },
        en: {
            name: 'Earth', sub: 'Trái Đất', type: 'Terrestrial Planet',
            stats: [{label: 'Diameter', value: '12,742 km'}, {label: 'Distance to Sun', value: '149.6M km'}, {label: 'Orbit Period', value: '365 days'}],
            desc: 'Earth is the only known planet to harbor life, with 71% of its surface covered by water.'
        },
        zh: {
            name: '地球', sub: 'Earth', type: '类地行星',
            stats: [{label: '直径', value: '12,742 km'}, {label: '距太阳', value: '1.49亿 km'}, {label: '公转周期', value: '365天'}],
            desc: '地球是已知唯一存在生命的行星，表面71%被水覆盖。'
        }
    },
    {
        emoji: '🟠', color: '#CF6237',
        vi: {
            name: 'Sao Hỏa', sub: 'Mars', type: 'Hành tinh đất đá',
            stats: [{label: 'Đường kính', value: '6,779 km'}, {label: 'Cách Mặt Trời', value: '227.9 triệu km'}, {label: 'Chu kỳ quỹ đạo', value: '687 ngày'}],
            desc: 'Sao Hỏa hay Hành tinh Đỏ, là mục tiêu thám hiểm hàng đầu của con người trong tương lai.'
        },
        en: {
            name: 'Mars', sub: 'Sao Hỏa', type: 'Terrestrial Planet',
            stats: [{label: 'Diameter', value: '6,779 km'}, {label: 'Distance to Sun', value: '227.9M km'}, {label: 'Orbit Period', value: '687 days'}],
            desc: 'Mars, the Red Planet, is the primary target for future human exploration.'
        },
        zh: {
            name: '火星', sub: 'Mars', type: '类地行星',
            stats: [{label: '直径', value: '6,779 km'}, {label: '距太阳', value: '2.27亿 km'}, {label: '公转周期', value: '687天'}],
            desc: '火星又称红色星球，是人类未来探索的主要目标。'
        }
    },
    {
        emoji: '🟤', color: '#C88B3A',
        vi: {
            name: 'Sao Mộc', sub: 'Jupiter', type: 'Hành tinh khí',
            stats: [{label: 'Đường kính', value: '139,820 km'}, {label: 'Cách Mặt Trời', value: '778.5 triệu km'}, {label: 'Chu kỳ quỹ đạo', value: '11.9 năm'}],
            desc: 'Sao Mộc là hành tinh lớn nhất hệ mặt trời, đóng vai trò bảo vệ Trái Đất khỏi tiểu hành tinh.'
        },
        en: {
            name: 'Jupiter', sub: 'Sao Mộc', type: 'Gas Giant',
            stats: [{label: 'Diameter', value: '139,820 km'}, {label: 'Distance to Sun', value: '778.5M km'}, {label: 'Orbit Period', value: '11.9 years'}],
            desc: 'Jupiter is the largest planet, acting as a shield protecting Earth from asteroids.'
        },
        zh: {
            name: '木星', sub: 'Jupiter', type: '气态巨行星',
            stats: [{label: '直径', value: '139,820 km'}, {label: '距太阳', value: '7.78亿 km'}, {label: '公转周期', value: '11.9年'}],
            desc: '木星是太阳系中最大的行星，起到了保护地球免受小行星撞击的盾牌作用。'
        }
    },
    {
        emoji: '💛', color: '#D4B96A',
        vi: {
            name: 'Sao Thổ', sub: 'Saturn', type: 'Hành tinh khí',
            stats: [{label: 'Đường kính', value: '116,460 km'}, {label: 'Cách Mặt Trời', value: '1.43 tỷ km'}, {label: 'Chu kỳ quỹ đạo', value: '29.5 năm'}],
            desc: 'Sao Thổ nổi tiếng với hệ thống vành đai khổng lồ làm từ băng và đá.'
        },
        en: {
            name: 'Saturn', sub: 'Sao Thổ', type: 'Gas Giant',
            stats: [{label: 'Diameter', value: '116,460 km'}, {label: 'Distance to Sun', value: '1.43B km'}, {label: 'Orbit Period', value: '29.5 years'}],
            desc: 'Saturn is famous for its extensive ring system made of ice and rock.'
        },
        zh: {
            name: '土星', sub: 'Saturn', type: '气态巨行星',
            stats: [{label: '直径', value: '116,460 km'}, {label: '距太阳', value: '14.3亿 km'}, {label: '公转周期', value: '29.5年'}],
            desc: '土星以其由冰和岩石组成的巨大光环系统而闻名。'
        }
    },
    {
        emoji: '🩵', color: '#6DD8E8',
        vi: {
            name: 'Sao Thiên Vương', sub: 'Uranus', type: 'Hành tinh băng',
            stats: [{label: 'Đường kính', value: '50,724 km'}, {label: 'Cách Mặt Trời', value: '2.87 tỷ km'}, {label: 'Chu kỳ quỹ đạo', value: '84 năm'}],
            desc: 'Sao Thiên Vương có trục quay nghiêng gần 90 độ, khiến nó lăn trên quỹ đạo.'
        },
        en: {
            name: 'Uranus', sub: 'Sao Thiên Vương', type: 'Ice Giant',
            stats: [{label: 'Diameter', value: '50,724 km'}, {label: 'Distance to Sun', value: '2.87B km'}, {label: 'Orbit Period', value: '84 years'}],
            desc: 'Uranus has an extreme axial tilt, causing it to roll around the Sun.'
        },
        zh: {
            name: '天王星', sub: 'Uranus', type: '冰巨星',
            stats: [{label: '直径', value: '50,724 km'}, {label: '距太阳', value: '28.7亿 km'}, {label: '公转周期', value: '84年'}],
            desc: '天王星的自转轴倾斜度极大，几乎是在轨道上滚动的。'
        }
    },
    {
        emoji: '🔵', color: '#3E54B5',
        vi: {
            name: 'Sao Hải Vương', sub: 'Neptune', type: 'Hành tinh băng',
            stats: [{label: 'Đường kính', value: '49,244 km'}, {label: 'Cách Mặt Trời', value: '4.5 tỷ km'}, {label: 'Chu kỳ quỹ đạo', value: '165 năm'}],
            desc: 'Sao Hải Vương là hành tinh xa nhất, với những cơn gió siêu thanh cực mạnh.'
        },
        en: {
            name: 'Neptune', sub: 'Sao Hải Vương', type: 'Ice Giant',
            stats: [{label: 'Diameter', value: '49,244 km'}, {label: 'Distance to Sun', value: '4.5B km'}, {label: 'Orbit Period', value: '165 years'}],
            desc: 'Neptune is the farthest planet, known for its supersonic winds.'
        },
        zh: {
            name: '海王星', sub: 'Neptune', type: '冰巨星',
            stats: [{label: '直径', value: '49,244 km'}, {label: '距太阳', value: '45亿 km'}, {label: '公转周期', value: '165年'}],
            desc: '海王星是最远的行星，以超音速狂风著称。'
        }
    }
];
