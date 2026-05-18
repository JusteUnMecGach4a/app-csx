const SITE_URL = "https://cscbarleduc.centres-sociaux.fr/";
const API = SITE_URL + "wp-json/wp/v2/posts?_embed";
const API_SINGLE = SITE_URL + "wp-json/wp/v2/posts/";

function decodeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return normalizeUnicodeText(txt.value);
}

function normalizeUnicodeText(text) {
    if (!text || typeof text !== 'string') return text;
    let normalized = text.replace(/[\uD835][\uDC00-\uDFFF]/g, function (char) {
        var high = char.charCodeAt(0);
        var low = char.charCodeAt(1);
        var code = (high - 0xD800) * 0x400 + (low - 0xDC00) + 0x10000;
        var offset = 0;
        if (code >= 0x1D5D4 && code <= 0x1D5ED) offset = code - 0x1D5D4 + 65;
        else if (code >= 0x1D5EE && code <= 0x1D607) offset = code - 0x1D5EE + 97;
        else if (code >= 0x1D400 && code <= 0x1D419) offset = code - 0x1D400 + 65;
        else if (code >= 0x1D41A && code <= 0x1D433) offset = code - 0x1D41A + 97;
        return offset ? String.fromCharCode(offset) : char;
    });
    var accentMap = {
        'e\u0300': 'è', 'e\u0301': 'é', 'e\u0302': 'ê', 'e\u0308': 'ë',
        'a\u0300': 'à', 'a\u0302': 'â', 'i\u0302': 'î', 'i\u0308': 'ï',
        'o\u0302': 'ô', 'u\u0300': 'ù', 'u\u0302': 'û', 'c\u0327': 'ç',
        'E\u0300': 'È', 'E\u0301': 'É', 'A\u0300': 'À'
    };
    for (var key in accentMap) {
        normalized = normalized.split(key).join(accentMap[key]);
    }
    try {
        return (normalized.normalize) ? normalized.normalize('NFC') : normalized;
    } catch (e) {
        return normalized;
    }
}

function createCard(p) {
    var img = '';
    if (p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0]) {
        img = p._embedded['wp:featuredmedia'][0].source_url;
    } else if (p.content && p.content.rendered && p.content.rendered.includes('<img')) {
        var m = p.content.rendered.match(/<img [^>]*src="([^"]+)"/);
        if (m) img = m[1];
    }

    var card = document.createElement('a');
    card.className = 'news-card';
    card.href = 'article.html?id=' + p.id;
    card.style.textDecoration = 'none';
    card.style.color = 'inherit';
    
    sessionStorage.setItem('post_' + p.id, JSON.stringify(p));

    card.innerHTML = (img ? '<img src="' + img + '" class="news-img" onerror="this.style.display=\'none\'">' : '') +
        '<div class="news-body">' +
        '<small>VOIR L\'ARTICLE</small>' +
        '<h3>' + decodeHtml(p.title.rendered) + '</h3>' +
        '<p>' + normalizeUnicodeText(p.excerpt.rendered.replace(/<[^>]*>?/gm, '')).substring(0, 80) + '...</p>' +
        '</div>';
    return card;
}

function loadHomeNews() {
    var div = document.getElementById('home-news');
    if (!div) return;
    fetch(API + "&per_page=4")
        .then(r => r.json())
        .then(posts => {
            div.innerHTML = '';
            if (!posts || posts.length === 0 || posts.code) {
                div.innerHTML = '<p style="text-align:center; padding:20px">Aucune actualité pour le moment.</p>';
                return;
            }
            posts.forEach(p => div.appendChild(createCard(p)));
        })
        .catch(err => {
            console.error('Home News Error:', err);
            div.innerHTML = '<p style="color:red; text-align:center; padding:20px">Erreur de connexion au site.</p>';
        });
}

function loadFullNews() {
    var div = document.getElementById('news-full-list');
    if (!div) return;
    div.innerHTML = '<div class="loader">Chargement...</div>';
    fetch(API + "&per_page=12")
        .then(r => r.json())
        .then(posts => {
            div.innerHTML = '';
            if (!posts || posts.length === 0 || posts.code) {
                div.innerHTML = '<p style="text-align:center; padding:20px">Pas d\'articles trouvés.</p>';
                return;
            }
            posts.forEach(p => div.appendChild(createCard(p)));
        })
        .catch(err => {
            console.error('Full News Error:', err);
            div.innerHTML = '<p style="color:red; text-align:center; padding:20px">Impossible de charger les actualités.</p>';
        });
}

window.loadActivities = function(cat) {
    var div = document.getElementById('activities-list');
    if (!div) return;
    div.innerHTML = '<div class="loader">Recherche...</div>';

    var tags = document.querySelectorAll('.cat-tag');
    for (var i = 0; i < tags.length; i++) {
        tags[i].classList.remove('active');
        if (tags[i].getAttribute('data-cat') === cat) tags[i].classList.add('active');
    }

    var url = API + "&per_page=12";
    if (cat !== 'all') {
        url += "&categories=" + cat;
    }

    fetch(url)
        .then(r => r.json())
        .then(posts => {
            div.innerHTML = '';
            if (!posts || posts.length === 0 || posts.code) {
                div.innerHTML = '<p style="text-align:center; padding:20px">Aucun contenu trouvé pour cette sélection.</p>';
            } else {
                posts.forEach(p => div.appendChild(createCard(p)));
            }
        })
        .catch(err => {
            console.error('Activities Error:', err);
            div.innerHTML = '<p style="color:red; text-align:center; padding:20px">Erreur lors de la recherche.</p>';
        });
}

window.setDynamicHours = function(centerId) {
    var div = document.getElementById('dynamic-hours');
    if (!div) return;
    centerId = centerId || 'marbot';

    var tags = document.querySelectorAll('#center-selector .mini-tag');
    tags.forEach(t => {
        t.classList.remove('active');
        if (t.getAttribute('onclick').includes(centerId)) t.classList.add('active');
    });

    var schedules = {
        'marbot': ["Fermé", "13h30-18h", "9h30-12h / 13h30-18h", "9h30-12h / 13h30-18h", "9h30-12h / 13h30-18h", "9h30-12h / 13h30-17h", "Fermé"],
        'liberation': ["Fermé", "13h30-18h", "9h30-12h / 13h30-18h", "9h30-12h / 13h30-18h", "9h30-12h / 13h30-18h", "9h30-12h / 13h30-17h", "Fermé"],
        'cote': ["Fermé", "13h30-18h", "9h30-12h / 13h30-18h", "9h30-12h / 13h30-18h", "9h30-12h / 13h30-18h", "9h30-12h / 13h30-17h", "Fermé"]
    };

    var now = new Date();
    var todayIdx = now.getDay();
    var tomorrowIdx = (todayIdx + 1) % 7;

    var html = '<span>Aujourd\'hui :</span> <strong>' + schedules[centerId][todayIdx] + '</strong>' +
        '<span>Demain :</span> <strong>' + schedules[centerId][tomorrowIdx] + '</strong>';

    div.innerHTML = html;
}

function loadArticle() {
    var viewer = document.getElementById('article-viewer');
    if (!viewer) return;
    
    var urlParams = new URLSearchParams(window.location.search);
    var id = urlParams.get('id');
    
    if (!id) {
        viewer.innerHTML = '<p style="text-align:center; padding:20px">Article introuvable.</p>';
        return;
    }

    var renderPost = function(post) {
        var img = post._embedded && post._embedded['wp:featuredmedia'] ? post._embedded['wp:featuredmedia'][0].source_url : '';
        viewer.innerHTML = (img ? '<img src="' + img + '" style="width:100%; border-radius:20px; margin-bottom:20px">' : '') +
            '<h1>' + decodeHtml(post.title.rendered) + '</h1>' +
            '<p style="color:var(--primary); font-weight:700; margin:10px 0">' + new Date(post.date).toLocaleDateString() + '</p>' +
            '<article class="article-content">' + normalizeUnicodeText(post.content.rendered) + '</article>';
    };

    var cached = sessionStorage.getItem('post_' + id);
    if (cached) {
        renderPost(JSON.parse(cached));
    } else {
        viewer.innerHTML = '<div class="loader">Chargement...</div>';
        fetch(API_SINGLE + id + "?_embed")
            .then(r => r.json())
            .then(post => renderPost(post))
            .catch(err => {
                viewer.innerHTML = '<p style="color:red; text-align:center; padding:20px">Erreur de chargement.</p>';
            });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('home-news')) {
        loadHomeNews();
        setDynamicHours('marbot');
    }
    if (document.getElementById('activities-list')) {
        loadActivities('all');
    }
    if (document.getElementById('news-full-list')) {
        loadFullNews();
    }
    if (document.getElementById('article-viewer')) {
        loadArticle();
    }
});
