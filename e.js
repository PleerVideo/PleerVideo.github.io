window.addEventListener('resize', resize);
document.addEventListener('DOMContentLoaded', option);

function resize() {
    if (!document.querySelector('div')) {
        return;
    }
    var h = window.innerHeight
        || document.documentElement.clientHeight
        || document.body.clientHeight;
    var w = window.innerWidth
        || document.documentElement.clientWidth
        || document.body.clientWidth;
    if (h < 279) {
        if (w >= 640) {
            document.querySelector('div').style.left = '7px';
            document.querySelector('div').style.top = '40px';
        } else {
            document.querySelector('div').style.left = '7px';
            document.querySelector('div').style.top = '40px';
        }
    } else if (h < 359) {
        if (w >= 640) {
            document.querySelector('div').style.left = '7px';
            document.querySelector('div').style.top = '55px';
        } else {
            document.querySelector('div').style.left = '7px';
            document.querySelector('div').style.top = '55px';
        }
    } else if (h < 449) {
        if (w >= 640) {
            document.querySelector('div').style.left = '15px';
            document.querySelector('div').style.top = '75px';
        } else {
            document.querySelector('div').style.left = '7px';
            document.querySelector('div').style.top = '55px';
        }
    } else if (h < 600) {
        if (w >= 800) {
            document.querySelector('div').style.left = '15px';
            document.querySelector('div').style.top = '90px';
        } else if (w >= 640) {
            document.querySelector('div').style.left = '15px';
            document.querySelector('div').style.top = '75px';
        } else if (w < 480) {
            document.querySelector('div').style.left = '7px';
            document.querySelector('div').style.top = '40px';
        } else {
            document.querySelector('div').style.left = '7px';
            document.querySelector('div').style.top = '55px';
        }
    } else {
        document.querySelector('div').style.left = '15px';
        document.querySelector('div').style.top = '90px';
    }
}

function season(self) {
    document.querySelectorAll('.season').forEach(function (s) {
        s.style.display = 'none'
    });
    var episodes = document.querySelector('.S' + self.options[self.selectedIndex].value);
    episodes.style.display = 'inline-block';
    document.querySelector('iframe').src = episodes.options[episodes.options.length-1].value;
    episodes.selectedIndex = '' + (episodes.options.length-1);
}

function episode(self) {
    document.querySelector('iframe').src = self.options[self.selectedIndex].value
}

function option() {
    if(window.location.hash) {
        var hash = window.location.hash.substring(1);
        var iframe = document.querySelector('iframe');
        if (/^[0-9]+$/i.test(hash)) {
            iframe.src = iframe.src
                .replace(/(videoid=[0-9]+)/i, 'videoid=' + hash);
        } else if (/^S[0-9]+E[0-9]+$/i.test(hash)) {
            let [S, E] = hash.split(/E/i);
            S = parseInt(S.replace(/[^0-9]/, ''));
            E = parseInt(E.replace(/[^0-9]/, ''));
            if (!document.querySelector('.S' + S + 'E' + E)) return;
            document.querySelectorAll('.season').forEach(function (s) {s.selectedIndex = -1; s.style.display = 'none'});
            document.querySelector('.seasons').selectedIndex = -1;
            Array.from(document.querySelector('.seasons').options).forEach(function (o) {if (o.value === ('' + S)) {o.selected = true;}});
            document.querySelector('.S' + S).style.display = 'inline-block';
            iframe.src = document.querySelector('.S' + S + 'E' + E).value;
            document.querySelector('.S' + S + 'E' + E).selected = true;
        }
    }
}

resize();