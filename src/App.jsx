import React from 'react';
import { css } from './css.js';
import { photo, pick } from './photos.js';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    var theme = 'light';
    try {
      var saved = window.localStorage.getItem('cm-theme');
      if (saved === 'light' || saved === 'dark') theme = saved;
      else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
    } catch (e) {}
    this.reduced = false;
    try { this.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}
    this.timers = [];
    this.howEls = [];
    var self = this;
    this.howRefFns = [0, 1, 2].map(function (i) { return function (el) { self.howEls[i] = el; }; });
    this.state = {
      theme: theme, navScrolled: false, drawerOpen: false, stickyBar: false,
      modalOpen: false, trialEmail: '', trialError: '', trialSent: false,
      toast: '', toastShow: false,
      heroStep: this.reduced ? 6 : 0,
      closet: 'nikki', messages: [], phase: 'initial', typing: false, input: '', phIdx: 0,
      scenario: null, open: {}, pop: null,
      calc: { tops: 25, bottoms: 10, dresses: 4, shoes: 6, layers: 4 },
      annual: false, faqOpen: -1, howActive: 0, tIndex: 0,
      newsletter: '', newsletterMsg: '', footerOpen: -1
    };
    this.onScroll = this.onScroll.bind(this);
    this.onModalKey = this.onModalKey.bind(this);
    this.onDrawerKey = this.onDrawerKey.bind(this);
  }

  /* ---------- lifecycle ---------- */
  componentDidMount() {
    var self = this;
    try { document.addEventListener('scroll', this.onScroll, true); } catch (e) {}
    if (!this.reduced) this.playHero();
    if (!this.reduced) {
      this.phTimer = setInterval(function () { if (!self.state.input) self.setState({ phIdx: (self.state.phIdx + 1) % 3 }); }, 3800);
    }
    try {
      if (window.IntersectionObserver) {
        this.io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              var i = self.howEls.indexOf(en.target);
              if (i > -1 && i !== self.state.howActive) self.setState({ howActive: i });
            }
          });
        }, { rootMargin: '-35% 0px -50% 0px' });
        this.howEls.forEach(function (el) { if (el) self.io.observe(el); });
      }
    } catch (e) {}
  }

  componentWillUnmount() {
    try { document.removeEventListener('scroll', this.onScroll, true); } catch (e) {}
    this.clearTimers();
    if (this.phTimer) clearInterval(this.phTimer);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.io) this.io.disconnect();
  }

  componentDidUpdate(prevProps, prevState) {
    var self = this;
    if (this.state.modalOpen && !prevState.modalOpen) {
      setTimeout(function () {
        var m = document.querySelector('.cm-modal');
        if (m) { m.addEventListener('keydown', self.onModalKey); var b = m.querySelector('button, a, input'); if (b) b.focus(); }
      }, 30);
    }
    if (!this.state.modalOpen && prevState.modalOpen) {
      if (this.lastFocus && this.lastFocus.focus) { try { this.lastFocus.focus(); } catch (e) {} }
    }
    if (this.state.drawerOpen && !prevState.drawerOpen) {
      setTimeout(function () {
        var d = document.querySelector('.cm-drawer');
        if (d) { d.addEventListener('keydown', self.onDrawerKey); var a = d.querySelector('a, button'); if (a) a.focus(); }
      }, 30);
    }
    if (!this.state.drawerOpen && prevState.drawerOpen) {
      var h = document.querySelector('[aria-controls="cm-drawer"]');
      if (h && h.focus) { try { h.focus(); } catch (e) {} }
    }
  }

  onScroll(e) {
    var y = 0;
    try {
      var t = e && e.target;
      if (!t || t === document || t === document.documentElement || t === document.body) y = window.scrollY || document.documentElement.scrollTop || 0;
      else if (t.querySelector && t.querySelector('.cm-root')) y = t.scrollTop || 0;
      else return;
    } catch (err) { return; }
    var scrolled = y > 40, sticky = y > 640;
    if (scrolled !== this.state.navScrolled || sticky !== this.state.stickyBar) this.setState({ navScrolled: scrolled, stickyBar: sticky });
  }

  clearTimers() { this.timers.forEach(function (t) { clearTimeout(t); }); this.timers = []; }
  later(fn, ms) { var t = setTimeout(fn, ms); this.timers.push(t); return t; }

  /* ---------- hero ---------- */
  playHero() {
    var self = this;
    this.clearTimers();
    if (this.reduced) { this.setState({ heroStep: 6 }); return; }
    this.setState({ heroStep: 0 });
    [500, 1100, 2200, 3700, 4300, 5400].forEach(function (ms, i) {
      self.later(function () { self.setState({ heroStep: i + 1 }); }, ms);
    });
  }

  /* ---------- items ---------- */
  shapes() {
    return {
      tee: ['M22 10 L14 14 L6 24 L14 30 L18 26 L18 56 L46 56 L46 26 L50 30 L58 24 L50 14 L42 10 Q32 18 22 10 Z', 'M24 12 Q32 18 40 12'],
      knit: ['M23 9 L15 12 L9 40 L15 41 L19 22 L20 56 L44 56 L45 22 L49 41 L55 40 L49 12 L41 9 Q32 15 23 9 Z', 'M20 52 L44 52 M10 37 L16 38 M48 38 L54 37'],
      shirt: ['M22 9 L13 13 L8 44 L14 45 L18 24 L18 56 L46 56 L46 24 L50 45 L56 44 L51 13 L42 9 Z', 'M22 9 L32 18 L42 9 M32 18 L32 56 M30 26 L34 26 M30 36 L34 36 M30 46 L34 46'],
      blazer: ['M22 8 L12 12 L8 44 L14 45 L17 24 L18 56 L46 56 L47 24 L50 45 L56 44 L52 12 L42 8 L32 30 Z', 'M22 8 L27 30 L32 34 M42 8 L37 30 L32 34 M32 34 L32 56 M22 44 L28 44'],
      jacket: ['M22 8 L12 12 L8 44 L14 45 L17 24 L18 54 L46 54 L47 24 L50 45 L56 44 L52 12 L42 8 Q32 14 22 8 Z', 'M32 12 L32 54 M18 50 L46 50 M22 24 L28 24 M36 24 L42 24'],
      cardigan: ['M23 8 L13 12 L8 46 L14 47 L18 24 L18 56 L46 56 L46 24 L50 47 L56 46 L51 12 L41 8 L32 28 Z', 'M32 28 L32 56 M30 34 L34 34 M30 42 L34 42 M30 50 L34 50'],
      coat: ['M22 6 L12 10 L8 46 L14 47 L17 22 L16 60 L48 60 L47 22 L50 47 L56 46 L52 10 L42 6 L32 26 Z', 'M22 6 L27 26 L32 30 M42 6 L37 26 L32 30 M32 30 L32 60 M28 36 L28 38 M28 46 L28 48'],
      vest: ['M24 8 L16 14 L16 54 L48 54 L48 14 L40 8 L32 26 Z', 'M24 8 L32 26 L40 8 M16 50 L48 50'],
      skirt: ['M22 10 L42 10 L52 56 L12 56 Z', 'M22 15 L42 15 M27 15 L22 56 M37 15 L42 56'],
      pleated: ['M21 10 L43 10 L52 56 L12 56 Z', 'M21 15 L43 15 M26 15 L20 56 M30 15 L28 56 M34 15 L36 56 M38 15 L44 56'],
      trousers: ['M20 8 L44 8 L50 58 L36 58 L32 24 L28 58 L14 58 Z', 'M20 13 L44 13 M32 13 L32 24'],
      jeans: ['M21 8 L43 8 L45 58 L35 58 L32 22 L29 58 L19 58 Z', 'M21 13 L43 13 M32 13 L32 22 M24 17 Q27 20 30 17'],
      cargo: ['M19 8 L45 8 L51 58 L36 58 L32 24 L28 58 L13 58 Z', 'M19 13 L45 13 M17 32 L25 32 L25 40 L17 40 M39 32 L47 32 L47 40 L39 40'],
      dress: ['M25 6 L23 16 L26 22 L14 58 L50 58 L38 22 L41 16 L39 6 Q32 12 25 6 Z', 'M26 22 L38 22'],
      heels: ['M8 42 Q18 32 32 40 L50 44 Q57 46 55 50 L18 50 L15 58 L11 58 L11 46 Z', 'M32 40 L30 50'],
      sandals: ['M8 46 L54 46 Q57 50 52 52 L23 52 L23 58 L14 58 L14 52 L8 52 Z', 'M20 46 Q26 36 34 46 M38 46 Q43 39 48 46'],
      sneakers: ['M6 40 Q8 32 18 34 L28 30 Q34 38 44 38 Q56 40 58 46 L58 52 L6 52 Z', 'M6 47 L58 47 M22 34 L26 40 M28 32 L32 38'],
      loafers: ['M6 44 Q8 36 20 36 L40 38 Q56 40 58 48 L58 52 L6 52 Z', 'M28 38 Q34 45 42 40 M6 48 L58 48'],
      boots: ['M15 8 L31 8 L31 38 L50 42 Q58 44 58 52 L58 56 L12 56 L14 30 Z', 'M31 13 L31 32 M12 51 L58 51'],
      platform: ['M15 8 L31 8 L31 36 L50 40 Q58 42 58 48 L58 58 L12 58 L14 30 Z', 'M12 50 L58 50 M18 14 L26 14 M18 20 L26 20'],
      bag: ['M14 24 L50 24 L54 56 L10 56 Z', 'M22 24 Q22 10 32 10 Q42 10 42 24 M14 32 L50 32'],
      tote: ['M14 22 L50 22 L50 58 L14 58 Z', 'M22 22 L22 8 L30 8 L30 22 M34 22 L34 8 L42 8 L42 22']
    };
  }

  closetData() {
    return {
      nikki: { name: "Nikki's closet", who: '34 · she/her', desc: 'Warm classics for the office and weekends', items: [
        ['n1', 'Green satin midi skirt', 'skirt', '#2F6B4F'], ['n2', 'Black fitted knit top', 'knit', '#1E1E24'], ['n3', 'Camel blazer', 'blazer', '#C19A6B'],
        ['n4', 'Black pumps', 'heels', '#1E1E24'], ['n5', 'Tan block-heel sandals', 'sandals', '#C8A27A'], ['n6', 'Navy midi dress', 'dress', '#23315C'],
        ['n7', 'White tee', 'tee', '#FFFFFF'], ['n8', 'Cream wide-leg trousers', 'trousers', '#EADBC4'], ['n9', 'Dark-wash jeans', 'jeans', '#2E3F66'],
        ['n10', 'White sneakers', 'sneakers', '#FAFAFA'], ['n11', 'Denim jacket', 'jacket', '#6E8FB8'], ['n12', 'Light-blue button-down', 'shirt', '#C9DAEE'],
        ['n13', 'Grey cardigan', 'cardigan', '#9A9AA0'], ['n14', 'Rust silk blouse', 'shirt', '#B5553A'], ['n15', 'Black ankle boots', 'boots', '#2A2A2E'],
        ['n16', 'Cognac crossbody bag', 'bag', '#9A5B2E']] },
      marcus: { name: "Marcus's closet", who: '52 · he/him', desc: 'Smart classics, client dinners and weekends', items: [
        ['m1', 'Navy blazer', 'blazer', '#24335A'], ['m2', 'White oxford shirt', 'shirt', '#FFFFFF'], ['m3', 'Light-blue shirt', 'shirt', '#BFD3EA'],
        ['m4', 'Charcoal trousers', 'jeans', '#4A4D55'], ['m5', 'Khaki chinos', 'jeans', '#C9B48A'], ['m6', 'Dark jeans', 'jeans', '#2B3956'],
        ['m7', 'Brown loafers', 'loafers', '#7A4B2A'], ['m8', 'White leather sneakers', 'sneakers', '#F4F4F4'], ['m9', 'Grey merino crewneck', 'knit', '#8C8F96'],
        ['m10', 'Olive field jacket', 'jacket', '#5F6B3E'], ['m11', 'Navy polo', 'tee', '#2A3A63'], ['m12', 'Brown Chelsea boots', 'boots', '#6B4428'],
        ['m13', 'Camel overcoat', 'coat', '#B88A5A'], ['m14', 'Burgundy knit', 'knit', '#6E2638'], ['m15', 'White tee', 'tee', '#FFFFFF'],
        ['m16', 'Tan linen trousers', 'trousers', '#D6BF97']] },
      sam: { name: "Sam's closet", who: '26 · they/them', desc: 'Relaxed shapes, bold colour, thrifted finds', items: [
        ['s1', 'Oversized black tee', 'tee', '#1E1E24'], ['s2', 'Cream graphic tee', 'tee', '#EFE6D6'], ['s3', 'Olive wide-leg cargos', 'cargo', '#6B6B47'],
        ['s4', 'Light baggy jeans', 'trousers', '#8FA9C9'], ['s5', 'Chunky white sneakers', 'sneakers', '#F2F2F2'], ['s6', 'Black platform boots', 'platform', '#1E1E24'],
        ['s7', 'Rust corduroy jacket', 'jacket', '#9C5A34'], ['s8', 'Red plaid overshirt', 'shirt', '#9E3B3B'], ['s9', 'Lilac knit cardigan', 'cardigan', '#B9A3CC'],
        ['s10', 'Black pleated midi skirt', 'pleated', '#222226'], ['s11', 'Cream knit vest', 'vest', '#D9C9A3'], ['s12', 'Long black coat', 'coat', '#1E1E24'],
        ['s13', 'Silver loafers', 'loafers', '#B8BCC4'], ['s14', 'Canvas tote', 'tote', '#D8CDB5'], ['s15', 'Black wide-leg trousers', 'trousers', '#26262B'],
        ['s16', 'Striped long-sleeve top', 'knit', '#3E4C7A']] }
    };
  }

  isDarkHex(hex) {
    var h = hex.replace('#', '');
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) < 110;
  }

  itemIndex() {
    if (this._idx) return this._idx;
    var shapes = this.shapes(), data = this.closetData(), idx = {}, self = this;
    Object.keys(data).forEach(function (cid) {
      data[cid].items = data[cid].items.map(function (r) {
        var s = shapes[r[2]] || shapes.tee;
        var it = { id: r[0], name: r[1], alt: r[1], d: s[0], d2: s[1], color: r[3], stroke: self.isDarkHex(r[3]) ? 'rgba(255,255,255,0.6)' : 'rgba(30,34,53,0.55)' };
        var ph = self.cmPhotos()[r[0]];
        it.img = ph || ''; it.hasImg = !!ph; it.noImg = !ph;
        idx[r[0]] = it;
        return it;
      });
    });
    this._closets = data;
    this._idx = idx;
    return idx;
  }

  items(ids) { var idx = this.itemIndex(); return (ids || []).map(function (id) { return idx[id]; }).filter(Boolean); }

  scen() { if (!this._scen) this._scen = this.cmScenarios(); return this._scen; }

  /* ---------- toast / modal / drawer / theme ---------- */
  showToast(msg) {
    var self = this;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.setState({ toast: msg, toastShow: true });
    this.toastTimer = setTimeout(function () { self.setState({ toastShow: false }); }, 3400);
  }
  onModalKey(e) { if (e.key === 'Escape') { e.stopPropagation(); this.closeTrial(); } }
  onDrawerKey(e) { if (e.key === 'Escape') { e.stopPropagation(); this.setState({ drawerOpen: false }); } }
  openTrial() { try { this.lastFocus = document.activeElement; } catch (e) {} this.setState({ modalOpen: true, drawerOpen: false, trialSent: false, trialError: '' }); }
  closeTrial() {
    var m = document.querySelector('.cm-modal');
    if (m) m.removeEventListener('keydown', this.onModalKey);
    this.setState({ modalOpen: false });
  }
  validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || '').trim()); }

  /* ---------- demo ---------- */
  detectScenario(text) {
    var t = ' ' + text.toLowerCase() + ' ';
    if (/\b(wedding|cocktail|party|birthday|gala|event|opening|graduation|ceremony|reception|shower|anniversary|concert|festival|interview)\b/.test(t)) return 'event';
    if (/\b(rooftop|roof|windy|wind|dinner|date|drinks|bar|brunch|restaurant|night out)\b/.test(t)) return 'rooftop';
    var fashion = /\b(wear|wearing|outfit|outfits|dress|shoes|look|style|closet|clothes|jacket|skirt|pants|trousers|jeans|shirt|top|sneakers|heels|casual|formal|smart)\b/.test(t);
    if (/\b(work|office|job|business casual|meeting|commute|first day)\b/.test(t)) return 'today';
    if (fashion && /\b(today|morning|tomorrow|degrees|hot|humid|rain|rainy|cold|weather)\b/.test(t)) return 'today';
    if (/\b(teach|how do i|how should|what goes|go together|colou?rs?|match|matches|explain|proportion|fit|fits)\b/.test(t)) return 'teach';
    if (fashion) return 'clarify';
    return 'offtopic';
  }

  buildOutfit(o, key, isUpdate) {
    return { key: key, title: o.title, summary: o.summary, items: this.items(o.items), why: o.why, avoid: o.avoid, how: o.how, isUpdate: !!isUpdate };
  }

  sendInitial(text, scenKey, fromChip) {
    var self = this, sc = this.scen()[this.state.closet][scenKey];
    var msgs = this.state.messages.concat([{ role: 'user', text: text }]);
    this.setState({ messages: msgs, typing: true, input: '', phase: 'busy' });
    var chips = sc.chips;
    if (!fromChip && scenKey === 'today' && sc.chipsWork && /\b(job|first day|business casual|new role)\b/i.test(text)) chips = sc.chipsWork;
    var n = msgs.length;
    this.later(function () {
      self.setState({
        typing: false, phase: 'followup', scenario: scenKey,
        messages: self.state.messages.concat([{ role: 'stylist', text: sc.reply, chips: chips, outfits: sc.outfits.map(function (o, i) { return self.buildOutfit(o, 'm' + n + 'o' + i, false); }) }])
      });
    }, this.reduced ? 400 : 1600);
  }

  sendFollow(text) {
    var self = this, t = text.toLowerCase();
    var sc = this.scen()[this.state.closet][this.state.scenario];
    var msgs = this.state.messages.concat([{ role: 'user', text: text }]);
    var kind = /\b(shoe|shoes|heel|heels|sneaker|sneakers|boot|boots|sandal|sandals|loafer|loafers|flats?)\b/.test(t) ? 'shoes' : 'casual';
    if (this.detectScenario(text) === 'offtopic' && !/\b(casual|relaxed|comfy|comfortable|chill|swap|change|different|instead|less|more)\b/.test(t)) {
      this.setState({ messages: msgs, typing: true, input: '', phase: 'busy' });
      this.later(function () {
        self.setState({ typing: false, phase: 'followup', messages: self.state.messages.concat([{ role: 'stylist', text: "I'm best at clothes! Want me to swap a piece or change the vibe? Try 'swap the shoes' or 'more casual.'" }]) });
      }, this.reduced ? 300 : 1100);
      return;
    }
    var known = kind === 'shoes' || /\b(casual|relaxed|comfy|comfortable|chill|dress(ed)? down|less formal|laid.?back)\b/.test(t);
    this.setState({ messages: msgs, typing: true, input: '', phase: 'busy' });
    var n = msgs.length;
    this.later(function () {
      var outfit, reply;
      if (kind === 'shoes') {
        var base = sc.outfits[0], f = sc.shoes;
        outfit = self.buildOutfit({ title: 'Updated: ' + base.title, summary: f.summary, why: f.why, avoid: f.avoid, how: f.how,
          items: base.items.map(function (id) { return id === f.from ? f.to : id; }) }, 'm' + n + 'o0', true);
        reply = f.reply;
      } else {
        outfit = self.buildOutfit(sc.casual, 'm' + n + 'o0', true);
        reply = known ? sc.casual.reply : 'Here is one way to change it up, using the conversation so far. ' + sc.casual.reply;
      }
      self.setState({ typing: false, phase: 'done', messages: self.state.messages.concat([{ role: 'stylist', text: reply, outfits: [outfit], note: 'Revised from your follow-up' }]) });
    }, this.reduced ? 400 : 1500);
  }

  submitText(raw) {
    var text = (raw || '').trim().slice(0, 300);
    if (!text || this.state.phase === 'busy' || this.state.phase === 'done') return;
    var self = this;
    if (this.state.phase === 'followup') { this.sendFollow(text); return; }
    var k = this.detectScenario(text);
    if (k === 'offtopic' || k === 'clarify' || text.split(/\s+/).length < 3) {
      var msgs = this.state.messages.concat([{ role: 'user', text: text }]);
      var reply = k === 'offtopic' && text.split(/\s+/).length >= 3
        ? "I'm best at clothes! Tell me where you're going and I'll put a look together."
        : "Happy to help! Where are you headed, and what's the weather like? For example: 'dinner with friends Saturday, chilly evening.'";
      this.setState({ messages: msgs, typing: true, input: '', phase: 'busy' });
      this.later(function () { self.setState({ typing: false, phase: 'initial', messages: self.state.messages.concat([{ role: 'stylist', text: reply }]) }); }, this.reduced ? 300 : 1100);
      return;
    }
    this.sendInitial(text, k, false);
  }

  resetDemo() { this.clearDemoTimers(); this.setState({ messages: [], phase: 'initial', typing: false, input: '', scenario: null, open: {} }); }
  clearDemoTimers() { /* hero and demo share timers only when hero is replayed; keep simple */ }

  /* ---------- render ---------- */
  renderVals() {
    var self = this, s = this.state;
    var idx = this.itemIndex(), closets = this._closets;
    var dark = s.theme === 'dark';

    var hs = s.heroStep;
    var hero = { u1: hs >= 1, t1: hs === 2, s1: hs >= 3, u2: hs >= 4, t2: hs === 5, s2: hs >= 6 };

    var closetList = ['nikki', 'marcus', 'sam'].map(function (id) {
      var c = closets[id];
      return { id: id, name: c.name, who: c.who, desc: c.desc, pressed: s.closet === id ? 'true' : 'false',
        isNikki: id === 'nikki', isMarcus: id === 'marcus', isSam: id === 'sam',
        select: function () { if (s.closet !== id) { self.setState({ closet: id, messages: [], phase: 'initial', typing: false, scenario: null, open: {} }); } } };
    });
    var ac = closets[s.closet];

    var demoMessages = s.messages.map(function (m, mi) {
      var outfits = (m.outfits || []).map(function (o) {
        var open = !!s.open[o.key];
        return {
          key: o.key, title: o.title, summary: o.summary, items: o.items, why: o.why, avoid: o.avoid, how: o.how, isUpdate: o.isUpdate,
          open: open, ariaExpanded: open ? 'true' : 'false', panelId: 'cm-why-' + o.key,
          toggleLabel: open ? 'Hide details' : 'Why it works',
          toggle: function () { var nx = Object.assign({}, self.state.open); nx[o.key] = !nx[o.key]; self.setState({ open: nx }); },
          saved: false, heartLabel: 'Save ' + o.title + ' to Lookbook',
          heartClass: 'cm-heart' + (s.pop === o.key ? ' cm-pop' : ''),
          save: function () { self.setState({ pop: o.key }); setTimeout(function () { self.setState({ pop: null }); }, 450); self.showToast('Sign up to save looks to your Lookbook'); }
        };
      });
      return { key: 'msg' + mi, isUser: m.role === 'user', isStylist: m.role === 'stylist', text: m.text,
        hasChips: !!(m.chips && m.chips.length), chips: m.chips || [], hasOutfits: outfits.length > 0, outfits: outfits,
        isUpdate: outfits.length > 0 && outfits[0].isUpdate, hasNote: !!m.note, note: m.note || '' };
    });

    var placeholders = ['Rooftop dinner Friday, it’ll be windy, I want to look effortless', 'First day at a new job, they said business casual, it’s 90 degrees', 'What do I wear to a cocktail-attire wedding outdoors?'];
    var phase = s.phase;
    var sc = this.scen()[s.closet];

    var c = s.calc;
    var combos = (c.tops * c.bottoms + c.dresses) * c.shoes * (c.layers + 1);
    var calcDefs = [['tops', 'Tops'], ['bottoms', 'Bottoms'], ['dresses', 'Dresses / one-pieces'], ['shoes', 'Shoes'], ['layers', 'Jackets & layers']];
    var setCalc = function (k, v) { var n = Object.assign({}, self.state.calc); n[k] = Math.max(0, Math.min(200, isNaN(v) ? 0 : v)); self.setState({ calc: n }); };

    var faqData = [
      ['How do I add my clothes?', 'One photo at a time. ClosetMuse removes the background and fills in the details (type, color, how dressy it is), and you confirm or fix them. You can also paste a link from a store’s website.'],
      ['What can I ask the stylist?', 'Anything about getting dressed: outfits for today or an event, what a dress code means, what to wear to a specific venue, how to wear a piece, what goes with what. You can follow up as much as you like (“swap the shoes,” “something more casual”).'],
      ['Will it try to sell me clothes?', 'Your stylist always starts with what you already own. Shopping suggestions are optional, only appear when a piece would complete an outfit, and are clearly labeled when a link may earn us a commission. No ads.'],
      ['Does it work for my style, body, gender and age?', 'Yes. It works from your closet, your style profile and your feedback, not a trend board.'],
      ['What happens after the 14-day trial?', 'Nothing is charged. You can upgrade to Plus or keep using the Free plan (up to 40 items and about 50 stylist messages a month). Items over 40 are locked, never deleted.'],
      ['Is my data private?', 'Yes. Your photos are private and never sold, and you can delete your closet and data anytime.'],
      ['Is it on iPhone and Android?', 'Yes, both.']
    ];

    var howData = [
      ['Add your clothes', 'Snap one piece at a time. ClosetMuse removes the background and fills in the details; you confirm or fix them. Bought something online? Paste the link.'],
      ['Tell it about you', 'A quick style profile: fits you like, what you’re going for, your budget, your climate, your typical week.'],
      ['Start talking', 'Tap ‘Outfit for today,’ ‘Plan for an event’ or ‘Teach me something,’ or just ask. Save the looks you love to your Lookbook.']
    ];

    var tData = [
      { quote: 'It explained what cocktail attire actually means, then built the outfit from my own closet.', initials: 'AL', name: 'Ana L., 41', tint: '#F2B880' },
      { quote: 'I asked it to swap the shoes and it told me why the new ones worked better. I’m actually learning.', initials: 'JT', name: 'Jordan T., 29', tint: '#F6E3C6' },
      { quote: 'That skirt I never knew how to wear? I’ve worn it three times this month.', initials: 'DW', name: 'Denise W., 58', tint: '#E8D9EE' }
    ];

    var footerData = [
      ['Product', [['Try the stylist', '#stylist'], ['How it works', '#how'], ['Features', '#features'], ['Pricing', '#pricing'], ['FAQ', '#faq']]],
      ['Company', [['About', '#'], ['Contact', '#']]],
      ['Legal', [['Privacy policy', '#'], ['Terms of service', '#'], ['Affiliate disclosure', '#']]]
    ];

    return {
      ph: idx, captureRaw: photo('0cf655d4cbb3d143be9035f66418a06f.jpg'), captureCut: photo('d878a16bd196342ee20e8793ac747be5.webp'),
      themeClass: dark ? 'cm-dark' : 'cm-light', isDark: dark, isLight: !dark,
      themeLabel: dark ? 'Switch to light mode' : 'Switch to dark mode',
      toggleTheme: function () { var nt = self.state.theme === 'dark' ? 'light' : 'dark'; try { window.localStorage.setItem('cm-theme', nt); } catch (e) {} self.setState({ theme: nt }); },
      navClass: 'cm-nav' + (s.navScrolled ? ' cm-nav-scrolled' : ''),
      drawerOpen: s.drawerOpen, drawerAria: s.drawerOpen ? 'true' : 'false',
      openDrawer: function () { self.setState({ drawerOpen: true }); },
      closeDrawer: function () { var d = document.querySelector('.cm-drawer'); if (d) d.removeEventListener('keydown', self.onDrawerKey); self.setState({ drawerOpen: false }); },
      showStickyBar: s.stickyBar && !s.drawerOpen && !s.modalOpen,

      openTrial: function () { self.openTrial(); },
      modalOpen: s.modalOpen, closeTrial: function () { self.closeTrial(); },
      trialEmail: s.trialEmail, onTrialEmail: function (e) { self.setState({ trialEmail: e.target.value, trialError: '' }); },
      submitTrialEmail: function (e) {
        if (e && e.preventDefault) e.preventDefault();
        if (!self.validEmail(self.state.trialEmail)) { self.setState({ trialError: 'Enter a valid email address so we can send the link.' }); return; }
        self.setState({ trialSent: true, trialError: '' });
        self.showToast('Download link sent. Check your inbox.');
      },
      trialError: s.trialError, hasTrialError: !!s.trialError, trialSent: s.trialSent,
      toastShow: s.toastShow, toastMsg: s.toast, toastClass: 'cm-toast' + (s.toastShow ? ' cm-toast-show' : ''),

      hero: hero, heroDone: hs >= 6,
      heroReplay: function () { self.playHero(); },
      heroOutfit1: this.items(['n1', 'n2', 'n3', 'n4']),
      heroOutfit2: this.items(['n1', 'n2', 'n3', 'n5']),

      closets: closetList,
      activeCloset: { name: ac.name, who: ac.who, desc: ac.desc, items: ac.items, countLabel: ac.items.length + ' items shown' },
      demoMessages: demoMessages,
      demoHasMessages: demoMessages.length > 0,
      demoEmpty: demoMessages.length === 0 && !s.typing,
      demoTyping: s.typing,
      demoBusy: phase === 'busy',
      demoInput: s.input,
      demoCount: s.input.length + '/300',
      demoPlaceholder: phase === 'followup' ? 'Try “swap the shoes” or “more casual”' : placeholders[s.phIdx % 3],
      onDemoInput: function (e) { self.setState({ input: (e.target.value || '').slice(0, 300) }); },
      onDemoSubmit: function (e) { if (e && e.preventDefault) e.preventDefault(); self.submitText(self.state.input); },
      onDemoKey: function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); self.submitText(self.state.input); } },
      showComposer: phase !== 'done',
      composerLabel: phase === 'followup' ? 'Ask a follow-up' : 'Describe where you’re going, the weather and the vibe',
      showQuickChips: phase === 'initial',
      quickChips: [['Outfit for today', 'today'], ['Plan for an event', 'event'], ['Teach me something', 'teach']].map(function (q) {
        return { label: q[0], run: function () { if (self.state.phase !== 'initial') return; self.sendInitial(sc[q[1]].prompt, q[1], true); } };
      }),
      showFollowHint: phase === 'followup',
      followChips: ['Swap the shoes', 'More casual'].map(function (l) { return { label: l, run: function () { if (self.state.phase === 'followup') self.sendFollow(l); } }; }),
      showTrialPrompt: phase === 'done',
      demoReset: function () { self.resetDemo(); },

      calc: calcDefs.map(function (d) {
        return { key: d[0], id: 'cm-calc-' + d[0], label: d[1], value: c[d[0]],
          inc: function () { setCalc(d[0], self.state.calc[d[0]] + 1); },
          dec: function () { setCalc(d[0], self.state.calc[d[0]] - 1); },
          onInput: function (e) { setCalc(d[0], parseInt(e.target.value, 10)); },
          decLabel: 'Fewer ' + d[1].toLowerCase(), incLabel: 'More ' + d[1].toLowerCase() };
      }),
      calcResult: combos.toLocaleString('en-US'),
      calcFormula: '(' + c.tops + ' × ' + c.bottoms + ' + ' + c.dresses + ') × ' + c.shoes + ' × (' + c.layers + ' + 1)',

      annual: s.annual, monthlyPressed: s.annual ? 'false' : 'true', annualPressed: s.annual ? 'true' : 'false',
      setMonthly: function () { self.setState({ annual: false }); }, setAnnual: function () { self.setState({ annual: true }); },
      plusPrice: s.annual ? '$79' : '$9.99', plusPer: s.annual ? '/year' : '/month',
      plusNote: s.annual ? '$79/year, about $6.58/month' : 'Billed monthly. Cancel anytime.',

      faqs: faqData.map(function (f, i) {
        var open = s.faqOpen === i;
        return { q: f[0], a: f[1], open: open, ariaExpanded: open ? 'true' : 'false', btnId: 'cm-faq-b' + i, panelId: 'cm-faq-p' + i,
          iconClass: 'cm-acc-icon' + (open ? ' cm-rot' : ''), toggle: function () { self.setState({ faqOpen: self.state.faqOpen === i ? -1 : i }); } };
      }),

      howSteps: howData.map(function (h, i) {
        var active = s.howActive === i;
        return { n: String(i + 1), title: h[0], text: h[1], active: active, ref: self.howRefFns[i],
          stepClass: 'cm-how-step' + (active ? ' cm-how-active' : ''), ariaCurrent: active ? 'step' : 'false',
          select: function () { self.setState({ howActive: i }); } };
      }),
      how0: s.howActive === 0, how1: s.howActive === 1, how2: s.howActive === 2,

      testimonials: tData,
      tActive: tData[s.tIndex], tPos: (s.tIndex + 1) + ' of ' + tData.length,
      tPrev: function () { self.setState({ tIndex: (self.state.tIndex + tData.length - 1) % tData.length }); },
      tNext: function () { self.setState({ tIndex: (self.state.tIndex + 1) % tData.length }); },

      newsletterEmail: s.newsletter,
      onNewsletter: function (e) { self.setState({ newsletter: e.target.value, newsletterMsg: '' }); },
      submitNewsletter: function (e) {
        if (e && e.preventDefault) e.preventDefault();
        if (!self.validEmail(self.state.newsletter)) { self.setState({ newsletterMsg: 'Please enter a valid email address.' }); return; }
        self.setState({ newsletter: '', newsletterMsg: 'You’re in. Your first style lesson is on its way.' });
        self.showToast('Subscribed. One style lesson a week.');
      },
      newsletterMsg: s.newsletterMsg, hasNewsletterMsg: !!s.newsletterMsg,
      footerGroups: footerData.map(function (g, i) {
        var open = s.footerOpen === i;
        return { title: g[0], links: g[1].map(function (l) { return { label: l[0], href: l[1] }; }), open: open,
          ariaExpanded: open ? 'true' : 'false', panelId: 'cm-foot-' + i, iconClass: 'cm-acc-icon' + (open ? ' cm-rot' : ''),
          toggle: function () { self.setState({ footerOpen: self.state.footerOpen === i ? -1 : i }); } };
      })
    };
  }

  cmPhotos() {
    return pick({
      n1: photo('d878a16bd196342ee20e8793ac747be5.webp'), n4: photo('64043eb12121b9b90a748584596b8142.webp'), n5: photo('ae7fe460ce4aea6fb32b4497b1a6f60d.webp'),
      n6: photo('c9d6fd0437d56fbd04d1ba27975926c6.webp'), n9: photo('99e9a8ba9aa722a6440dd6be94cae0d4.webp'), n10: photo('c9aec9fc68914c62113e725ffff1f960.webp'),
      n11: photo('33cd65f620072a60176b5c0fd1dcc66f.webp'), n12: photo('8db382e810144259243931bc3a2d4a05.webp'), n13: photo('d31a51de35de7d0789483f83510af33d.webp'),
      n16: photo('290dc6e3e5102914ea26140eb4532f4b.webp'), m1: photo('e746d20b44e8ec2aadf5c217c379908e.webp'), m3: photo('2ac5d4f64f108028915bb5c9fdc0a50f.webp'),
      n2: photo('cc4a4d58f0341b4b4ea119d9cfb441c4.webp'), n3: photo('dde0433d2c334f27cc94f7d79e4b554f.webp'), n7: photo('cb1c1513c76d26f1d58c3484f912de9a.webp'),
      n15: photo('876ea979a4176ff15252f9eb8c9cb37b.webp'), m2: photo('2ec52278e47f053b9fc0d02ec839c6fc.webp'), m5: photo('cd4b3dafc6ce4cfae5bc6f8942aab177.webp'),
      m6: photo('e86acb7137cc429a9135d1bfc9cb7b27.webp'), m9: photo('75d50bbcd4a780f40b132fa64fad52d2.webp'), m10: photo('c5bd6256cefe71042b6f8ce194f535b0.webp'),
      m11: photo('43975d0a25a7359a14a868ec91b88631.webp'), m12: photo('8267ca0c591aa04e9ab70725a746f1e0.webp'), m13: photo('74d8006a2c131cfbf651c7a97d9938d9.webp'),
      m15: photo('09fece7add519260451c367a15669fcb.webp'), s4: photo('c5031f78b83fd5b53965953747d6a47c.webp'), s5: photo('97e1baa420e3fb938a4d60dc0909172d.webp'),
      s6: photo('91f26acc6f2bd949e2092ddc341112a1.webp'), s7: photo('cd69a1da7b910d1b4dce1c9cf29d3344.webp'), s8: photo('95fd0d01f5fa8c229b463ee972b03e29.webp'),
      s11: photo('dd70222cc8e602fddea2fda110dbf6ca.webp'),
      s15: photo('cffec91b15ee857c3e72bed2b7ad364b.webp'), s10: photo('5057e8690e83af009eba5a6db2b3e26f.webp'), m7: photo('883d771ad985eea8e3117dac9556b79b.webp'),
      s13: photo('d008578e30e454dc15ade49972e03b7c.webp'), m8: photo('84dc1fd64b970ccceb95032cc122250e.webp'), s14: photo('f3d3813e8fc383507cefe532a49bdd95.webp'),
      m4: photo('3701fbd49c00cf8f85f6aa877fdef48e.webp'), s3: photo('0c2dc1f18e20447d9352f32a90b81e6d.webp'), s9: photo('41da78b58281607987278ff4c100a13c.webp'),
      s12: photo('a54a19fccfbbd9238367d54063c880d3.webp'), n8: photo('0c7b24c843a5e04103653f66cb954627.webp'), n14: photo('e9e23dec888dde7beef0ff2f187911e3.webp'),
      m14: photo('a5ba4c0f467ddaad718a2a30050f1612.webp'), m16: photo('da1b173dbdc94fdd96b6c623dc4966ec.webp'), s1: photo('809c8f502f0f6e9d7a7d4e1ed1e6a3db.webp'),
      s2: photo('26b80c51b0d6750e30bfa35e11d1c361.webp'), s16: photo('80215799a4cbfdd8851abdd5981dff10.webp')
    });
  }

  cmScenarios() {
    return {
      nikki: {
        today: {
          prompt: "Outfit for today",
          chips: [
            { k: "Occasion", v: "office day" },
            { k: "Weather", v: "90°F and humid (sample forecast)" },
            { k: "Vibe", v: "polished but comfortable" },
            { k: "Formality", v: "business casual" }
          ],
          chipsWork: [
            { k: "Occasion", v: "first day at a new job" },
            { k: "Dress code", v: "business casual" },
            { k: "Weather", v: "90°F, hot" },
            { k: "Vibe", v: "polished but cool" }
          ],
          reply: "It's going to be hot and sticky, so let's keep things light and loose at the waist. Here are two office looks from your closet that still feel put together.",
          outfits: [
            {
              title: "Breezy office polish",
              items: ["n8", "n14", "n5", "n16"],
              summary: "Cream wide-leg trousers, rust silk blouse and tan block heels.",
              why: "Wide legs let air move and feel relaxed at the waist. Rust, cream and tan are all warm colours, so the look reads calm and intentional.",
              avoid: "Skip a heavy blazer on the commute; carry it only if the office runs cold.",
              how: "Half-tuck the blouse so the waistline stays soft, not tight."
            },
            {
              title: "Easy dress day",
              items: ["n6", "n13", "n10"],
              summary: "Navy midi dress, grey cardigan for the AC, white sneakers.",
              why: "A midi dress is one piece, so it's instantly finished. Navy and grey are both cool, quiet colours that look professional together.",
              avoid: "Avoid tights today; bare legs and breathable shoes will feel much better.",
              how: "Drape the cardigan over your shoulders outside, put it on once you're inside."
            }
          ],
          shoes: {
            reply: "Sure. Swapping the sandals for your white sneakers keeps it polished but easier on your feet.",
            from: "n5",
            to: "n10",
            summary: "Same trousers and blouse, now with clean white sneakers.",
            why: "Clean white sneakers read modern, not sloppy, and the white echoes the cream trousers so the outfit still feels connected.",
            avoid: "Skip scuffed or chunky running shoes; keep the sneaker simple and clean.",
            how: "Let the trouser hem just graze the top of the sneaker."
          },
          casual: {
            reply: "Got it, let's relax it a notch while keeping it work-appropriate.",
            title: "Relaxed office day",
            items: ["n9", "n7", "n13", "n10"],
            summary: "Dark jeans, white tee, grey cardigan and white sneakers.",
            why: "Dark-wash jeans look sharper than light ones, and the cardigan adds a layer of polish over a simple tee.",
            avoid: "Avoid ripped or faded denim for the office.",
            how: "Tuck just the front of the tee so your outline stays defined."
          }
        },
        event: {
          prompt: "Plan for an event: my cousin's wedding is cocktail attire, outdoors at a vineyard in October. I have no idea what that means. Help.",
          chips: [
            { k: "Occasion", v: "cousin's wedding" },
            { k: "Dress code", v: "cocktail attire" },
            { k: "Venue", v: "outdoors, vineyard" },
            { k: "Weather", v: "October, cooler after sunset" },
            { k: "Preference", v: "nothing tight at the waist" }
          ],
          reply: "Cocktail attire means dressier than a work outfit, but not as formal as a gown. Outdoors, think about your shoes and a layer for when the sun goes down. Here are three looks from your closet.",
          outfits: [
            {
              title: "Vineyard cocktail look",
              items: ["n1", "n2", "n3", "n4"],
              summary: "Green satin skirt, black fitted knit, camel blazer, black pumps.",
              why: "The knit keeps the satin from looking like pajamas or evening wear. The blazer adds structure and warmth when the sun goes down, and camel and green are both warm colours that go together.",
              avoid: "Skip stilettos on grass. They'll sink.",
              how: "Tuck the knit loosely into the skirt and wear the blazer open so the waist stays comfortable."
            },
            {
              title: "Navy and rust",
              items: ["n6", "n3", "n5", "n16"],
              summary: "Navy midi dress, camel blazer, tan block-heel sandals.",
              why: "A navy midi is dressy without being formal. Camel and tan warm up the navy, and the block heel handles grass.",
              avoid: "Avoid a black cardigan here; it pulls the look toward the office.",
              how: "Push the blazer sleeves up slightly so it looks relaxed, not corporate."
            },
            {
              title: "Satin with a soft top",
              items: ["n1", "n14", "n5"],
              summary: "Green satin skirt with the rust silk blouse and tan sandals.",
              why: "Rust and green sit side by side on the colour wheel's warm side, so they look rich together. Two soft fabrics feel elegant at an evening event.",
              avoid: "Avoid adding a busy bag; let the colours be the star.",
              how: "Bring the camel blazer for later; it works with this look too."
            }
          ],
          shoes: {
            reply: "Done: your tan block-heel sandals. A block heel gives you the height without sinking into the grass.",
            from: "n4",
            to: "n5",
            summary: "Same look, now with tan block-heel sandals.",
            why: "A block heel spreads your weight, so it won't sink. Tan also ties back to the camel blazer, which pulls the whole outfit together.",
            avoid: "Avoid flat sneakers here; they drop the look below cocktail level.",
            how: "Keep jewellery simple and gold-toned to match the warm tan and camel."
          },
          casual: {
            reply: "If the wedding turns out more relaxed than the invite says, here's a softer version that still respects the dress code.",
            title: "Relaxed garden version",
            items: ["n1", "n7", "n11", "n5"],
            summary: "Green satin skirt, white tee, denim jacket, tan sandals.",
            why: "A plain tee and denim make satin feel easygoing, while the skirt keeps it special enough for a celebration.",
            avoid: "Avoid this for the ceremony if the invite says cocktail; it's a reception or after-party option.",
            how: "Tuck the tee fully and roll the jacket sleeves once."
          }
        },
        teach: {
          prompt: "Teach me something: how do I know if colors go together?",
          chips: [
            { k: "Topic", v: "pairing colours" },
            { k: "Format", v: "quick lesson" },
            { k: "Using", v: "your closet" }
          ],
          reply: "Here's an easy rule: colours are either warm (rust, camel, green, cream) or cool (navy, grey, light blue). Mix mostly one family, then pick one colour to be the star. Two examples from your closet:",
          outfits: [
            {
              title: "Warm family, green is the star",
              items: ["n1", "n7", "n3", "n5"],
              summary: "Green skirt as the star, with white, camel and tan supporting it.",
              why: "Every colour here is warm or neutral, so nothing fights. The green is the only strong colour, so your eye knows where to land.",
              avoid: "Avoid adding a second bright colour; two stars compete.",
              how: "Repeat a supporting colour twice (camel blazer, tan shoes) to make it look planned."
            },
            {
              title: "Cool family, navy is the star",
              items: ["n6", "n12", "n10"],
              summary: "Navy dress with a light-blue shirt layered over it and white sneakers.",
              why: "Navy and light blue are the same colour family at different depths, which always looks calm and intentional.",
              avoid: "Avoid mixing navy with black at equal amounts; they can look like a mismatch.",
              how: "Wear the button-down open over the dress like a light jacket."
            }
          ],
          shoes: {
            reply: "Good question to practise with. Swapping to white sneakers keeps the warm palette and adds a fresh neutral.",
            from: "n5",
            to: "n10",
            summary: "Green star, warm supporting colours, white sneakers.",
            why: "White is a neutral, so it never breaks a colour family. It just makes the look a little more casual.",
            avoid: "Avoid black shoes here; they would be the darkest thing and pull attention down.",
            how: "Neutrals (white, cream, tan, black, grey) are your safe swaps in any family."
          },
          casual: {
            reply: "Here's the same lesson in an everyday outfit.",
            title: "Everyday warm palette",
            items: ["n9", "n14", "n16", "n10"],
            summary: "Dark jeans, rust blouse, cognac bag, white sneakers.",
            why: "Rust is the star, and the cognac bag repeats a softer version of it. Denim works almost like a neutral.",
            avoid: "Avoid a bright pink or purple accessory; it starts a second story.",
            how: "Match your bag to the star colour's family for an easy pulled-together look."
          }
        },
        rooftop: {
          prompt: "Rooftop dinner Friday, it'll be windy, I want to look effortless",
          chips: [
            { k: "Occasion", v: "rooftop dinner" },
            { k: "Weather", v: "windy, evening" },
            { k: "Vibe", v: "effortless" },
            { k: "Formality", v: "smart casual" }
          ],
          reply: "Wind changes everything: skip floaty skirts and go for trousers with a structured layer. Here are two looks that feel easy but put together.",
          outfits: [
            {
              title: "Wind-proof and easy",
              items: ["n8", "n2", "n3", "n5"],
              summary: "Cream wide-leg trousers, black knit, camel blazer, tan sandals.",
              why: "Wide-leg trousers move nicely without blowing up like a skirt. The fitted knit balances the volume, and the blazer adds structure against the breeze.",
              avoid: "Skip the satin skirt tonight; wind and satin don't get along.",
              how: "Wear the blazer over your shoulders while you sit, on properly when the wind picks up."
            },
            {
              title: "Dark denim dinner",
              items: ["n9", "n14", "n11", "n15"],
              summary: "Dark jeans, rust silk blouse, denim jacket, black ankle boots.",
              why: "Silk dresses up the jeans, while the jacket keeps you warm. Ankle boots stay put on a windy rooftop.",
              avoid: "Avoid two denims in the exact same wash; here the jacket is lighter, which is the right contrast.",
              how: "Tuck the blouse loosely at the front so it doesn't billow."
            }
          ],
          shoes: {
            reply: "Swapped. Your black ankle boots give you more grip and warmth up there.",
            from: "n5",
            to: "n15",
            summary: "Same trousers, knit and blazer, now with black ankle boots.",
            why: "Black boots link to the black knit, so the top and bottom of the outfit echo each other. Covered feet help on a chilly rooftop.",
            avoid: "Avoid heels with thin straps if you'll be standing in the wind.",
            how: "Let the wide trousers fall over the boots so only the toe shows."
          },
          casual: {
            reply: "Easy. Here's a more laid-back version that still works for dinner.",
            title: "Laid-back rooftop",
            items: ["n9", "n7", "n13", "n10"],
            summary: "Dark jeans, white tee, grey cardigan, white sneakers.",
            why: "Simple pieces in quiet colours look relaxed but deliberate. The cardigan is your wind layer.",
            avoid: "Avoid a loose, thin top that will flap in the wind.",
            how: "Add the cognac bag for a warm accent."
          }
        }
      },
      marcus: {
        today: {
          prompt: "Outfit for today",
          chips: [
            { k: "Occasion", v: "office day" },
            { k: "Weather", v: "62°F, light rain (sample forecast)" },
            { k: "Vibe", v: "sharp but easy" },
            { k: "Formality", v: "business casual" }
          ],
          chipsWork: [
            { k: "Occasion", v: "first day at a new job" },
            { k: "Dress code", v: "business casual" },
            { k: "Weather", v: "90°F, hot" },
            { k: "Vibe", v: "polished but cool" }
          ],
          reply: "Cool and a bit wet today, so a layer and shoes that can handle puddles. Two looks from your closet:",
          outfits: [
            {
              title: "Rainy-day classic",
              items: ["m4", "m3", "m9", "m12"],
              summary: "Charcoal trousers, light-blue shirt, grey crewneck, Chelsea boots.",
              why: "Charcoal, grey and light blue are all cool, calm colours. The brown boots add warmth and handle the rain better than loafers.",
              avoid: "Skip suede loafers in the rain.",
              how: "Let the shirt collar sit outside the crewneck neckline."
            },
            {
              title: "Chinos and a field jacket",
              items: ["m5", "m2", "m10", "m12"],
              summary: "Khaki chinos, white oxford, olive field jacket, brown boots.",
              why: "Khaki, olive and brown are earthy colours that belong together. The field jacket is made for drizzle.",
              avoid: "Avoid a tie with the field jacket; it fights the relaxed mood.",
              how: "Roll the oxford sleeves once under the jacket for an easy feel."
            }
          ],
          shoes: {
            reply: "Sure. If the rain clears up, your brown loafers are a sharper choice.",
            from: "m12",
            to: "m7",
            summary: "Same outfit, now with brown loafers.",
            why: "Loafers are lighter and a touch dressier, and the brown still warms up the cool greys.",
            avoid: "Avoid white sneakers with charcoal trousers for the office; the contrast is too strong.",
            how: "Hem trousers so they just touch the top of the loafer."
          },
          casual: {
            reply: "Let's dial it back while keeping it tidy.",
            title: "Casual Friday",
            items: ["m6", "m11", "m10", "m8"],
            summary: "Dark jeans, navy polo, olive field jacket, white sneakers.",
            why: "Dark jeans and a polo are a step above a tee. Navy and olive are both muted, so they sit together easily.",
            avoid: "Avoid light or distressed jeans at work.",
            how: "Keep the polo untucked only if it ends at mid-zip of the jeans."
          }
        },
        event: {
          prompt: "Plan for an event: my friend's 50th birthday dinner at a nice restaurant, invite says smart casual.",
          chips: [
            { k: "Occasion", v: "50th birthday dinner" },
            { k: "Dress code", v: "smart casual" },
            { k: "Venue", v: "nice restaurant, indoors" },
            { k: "Vibe", v: "celebratory, grown-up" }
          ],
          reply: "Smart casual means a step up from everyday: a jacket or nice knit, no tie needed. For a nice restaurant, lean toward the dressier side. Two looks:",
          outfits: [
            {
              title: "Blazer, no tie",
              items: ["m1", "m2", "m5", "m7"],
              summary: "Navy blazer, white oxford, khaki chinos, brown loafers.",
              why: "Navy and khaki is a classic pairing that always looks right. The blazer says celebration; open collar keeps it relaxed.",
              avoid: "Avoid sneakers with the blazer for this one; the restaurant calls for leather shoes.",
              how: "Undo the top button only, and wear the blazer open when seated."
            },
            {
              title: "Rich knit",
              items: ["m14", "m4", "m7"],
              summary: "Burgundy knit, charcoal trousers, brown loafers.",
              why: "Burgundy feels warm and festive, and charcoal keeps it grown-up. A fine knit is as smart as a jacket at dinner.",
              avoid: "Avoid a chunky knit; a thin one looks dressier.",
              how: "Add the camel overcoat for arriving and leaving."
            }
          ],
          shoes: {
            reply: "Swapped to your brown Chelsea boots. They're just as smart and a bit more modern.",
            from: "m7",
            to: "m12",
            summary: "Navy blazer and chinos with brown Chelsea boots.",
            why: "Sleek leather boots are dressy enough for smart casual, and the brown still matches the warm khaki.",
            avoid: "Avoid chunky hiking-style boots with tailoring.",
            how: "Let the chinos sit neatly on top of the boot without bunching."
          },
          casual: {
            reply: "If it's a laid-back crowd, here's a relaxed take that still looks like you made an effort.",
            title: "Relaxed smart casual",
            items: ["m6", "m9", "m8"],
            summary: "Dark jeans, grey merino crewneck, white leather sneakers.",
            why: "Clean leather sneakers and fine merino keep jeans looking deliberate rather than everyday.",
            avoid: "Avoid a hoodie or athletic sneakers.",
            how: "Wear a collared shirt under the crewneck if the restaurant is formal."
          }
        },
        teach: {
          prompt: "Teach me something: how should trousers fit?",
          chips: [
            { k: "Topic", v: "trouser fit" },
            { k: "Format", v: "quick lesson" },
            { k: "Using", v: "your closet" }
          ],
          reply: "Three quick checks: the waist sits flat without a belt, the seat isn't pulling, and the hem just touches your shoe with little or no bunching. Here's how that plays out with your trousers:",
          outfits: [
            {
              title: "Clean break",
              items: ["m4", "m3", "m7"],
              summary: "Charcoal trousers, light-blue shirt, brown loafers.",
              why: "With loafers, a short hem that just kisses the shoe looks sharp and shows off the leather.",
              avoid: "Avoid a long hem that pools over loafers; it makes legs look shorter.",
              how: "If they bunch, a tailor can take up the hem cheaply."
            },
            {
              title: "Relaxed linen",
              items: ["m16", "m15", "m8"],
              summary: "Tan linen trousers, white tee, white sneakers.",
              why: "Linen is meant to be a bit looser. A slightly wider leg looks relaxed, while a clean hem keeps it neat.",
              avoid: "Avoid letting linen trousers drag on the ground.",
              how: "A single small cuff at the ankle works well with sneakers."
            }
          ],
          shoes: {
            reply: "Let's try boots to see how the hem changes.",
            from: "m7",
            to: "m12",
            summary: "Charcoal trousers and light-blue shirt with Chelsea boots.",
            why: "With boots, the trouser can sit a little longer and rest on the boot, since the shaft fills the space.",
            avoid: "Avoid tucking trousers into Chelsea boots.",
            how: "Check fit sitting down too; trousers should not pull at the knee."
          },
          casual: {
            reply: "Here's the same fit lesson with jeans.",
            title: "Jeans that fit",
            items: ["m6", "m11", "m8"],
            summary: "Dark jeans, navy polo, white sneakers.",
            why: "Jeans should follow your leg without clinging. A slight taper toward the ankle looks tidy with sneakers.",
            avoid: "Avoid very baggy seat and thigh; it reads sloppy rather than relaxed.",
            how: "Roll once if the hem stacks more than an inch on the shoe."
          }
        },
        rooftop: {
          prompt: "Rooftop dinner Friday, it'll be windy, I want to look effortless",
          chips: [
            { k: "Occasion", v: "rooftop dinner" },
            { k: "Weather", v: "windy, evening" },
            { k: "Vibe", v: "effortless" },
            { k: "Formality", v: "smart casual" }
          ],
          reply: "Windy and evening means a real layer that stays put. Here are two easygoing looks that still feel sharp:",
          outfits: [
            {
              title: "Effortless navy",
              items: ["m1", "m15", "m6", "m7"],
              summary: "Navy blazer over a white tee, dark jeans, brown loafers.",
              why: "A blazer over a tee is the definition of effortless: structured on top, relaxed underneath. Navy and dark denim blend smoothly.",
              avoid: "Avoid a thin shirt alone; you'll be cold once the sun drops.",
              how: "Push the blazer sleeves up a little for a relaxed feel."
            },
            {
              title: "Warm and textured",
              items: ["m14", "m16", "m10", "m8"],
              summary: "Burgundy knit, tan linen trousers, olive field jacket, white sneakers.",
              why: "Burgundy, tan and olive are warm earthy colours that look rich together. The field jacket handles the wind.",
              avoid: "Avoid flapping open shirts on a windy roof.",
              how: "Zip the jacket halfway so the knit still shows."
            }
          ],
          shoes: {
            reply: "Swapped to your white leather sneakers for a more relaxed feel.",
            from: "m7",
            to: "m8",
            summary: "Navy blazer, white tee, dark jeans, white sneakers.",
            why: "White sneakers repeat the white tee, so the top and bottom of the look connect.",
            avoid: "Avoid scuffed sneakers; clean ones keep the blazer looking sharp.",
            how: "No-show socks keep the line clean."
          },
          casual: {
            reply: "Here's an even easier version.",
            title: "Weekend rooftop",
            items: ["m6", "m11", "m10", "m8"],
            summary: "Dark jeans, navy polo, olive field jacket, white sneakers.",
            why: "Simple pieces in muted colours look calm and confident. The jacket is your wind layer.",
            avoid: "Avoid shorts; evenings on a roof get chilly fast.",
            how: "Leave the polo's top button open."
          }
        }
      },
      sam: {
        today: {
          prompt: "Outfit for today",
          chips: [
            { k: "Occasion", v: "studio workday" },
            { k: "Weather", v: "75°F, sunny (sample forecast)" },
            { k: "Vibe", v: "relaxed and bold" },
            { k: "Formality", v: "casual" }
          ],
          chipsWork: [
            { k: "Occasion", v: "first day at a new job" },
            { k: "Dress code", v: "business casual" },
            { k: "Weather", v: "90°F, hot" },
            { k: "Vibe", v: "polished but cool" }
          ],
          reply: "Sunny and mild, perfect for one statement layer. Two looks that feel like you:",
          outfits: [
            {
              title: "Corduroy and cargos",
              items: ["s3", "s2", "s7", "s5"],
              summary: "Olive cargos, cream graphic tee, rust corduroy jacket, chunky sneakers.",
              why: "Olive, cream and rust are warm earthy colours that sit together naturally. The jacket's texture keeps the relaxed shapes looking intentional.",
              avoid: "Avoid another oversized layer on top; one big volume piece is enough.",
              how: "Roll the jacket sleeves to show a bit of wrist and balance the volume."
            },
            {
              title: "Black and lilac",
              items: ["s15", "s1", "s9", "s13"],
              summary: "Black wide-leg trousers, oversized tee, lilac cardigan, silver loafers.",
              why: "Black on black is a calm base, so the lilac and silver get to stand out. Two accents is the sweet spot.",
              avoid: "Avoid adding a third bright colour; let lilac lead.",
              how: "Tuck the front of the tee so the wide trousers don't swallow your shape."
            }
          ],
          shoes: {
            reply: "Swapped to your silver loafers for a sharper, more playful finish.",
            from: "s5",
            to: "s13",
            summary: "Olive cargos, graphic tee and corduroy jacket with silver loafers.",
            why: "Sleek metallic loafers make relaxed cargos look deliberate, and silver is a neutral that works with warm colours too.",
            avoid: "Avoid letting the cargo hems swallow the loafers; cuff them.",
            how: "Cuff the cargos once so the loafers show."
          },
          casual: {
            reply: "Even easier, coming up.",
            title: "Low-key day",
            items: ["s4", "s16", "s8", "s5"],
            summary: "Light baggy jeans, striped long-sleeve, plaid overshirt, chunky sneakers.",
            why: "Stripes and plaid can mix when one is small and quiet. Here the thin stripe lets the red plaid lead.",
            avoid: "Avoid a third pattern in the mix.",
            how: "Wear the overshirt open like a light jacket."
          }
        },
        event: {
          prompt: "Plan for an event: a friend's gallery opening Friday night. The invite just says 'creative.' What does that even mean?",
          chips: [
            { k: "Occasion", v: "gallery opening" },
            { k: "Dress code", v: "creative" },
            { k: "Time", v: "Friday night" },
            { k: "Vibe", v: "expressive, a little dressed up" }
          ],
          reply: "'Creative' means there's no rulebook: wear something that feels like you, a little more interesting than every day. One strong piece plus clean basics works every time. Two looks:",
          outfits: [
            {
              title: "Pleats and platforms",
              items: ["s10", "s16", "s12", "s6"],
              summary: "Black pleated midi skirt, striped long-sleeve, long black coat, platform boots.",
              why: "Pleats bring movement and the stripe adds graphic interest, while all the black keeps it polished for an evening event.",
              avoid: "Avoid a busy bag that competes with the stripes.",
              how: "Tuck the top into the skirt and leave the coat open."
            },
            {
              title: "Statement texture",
              items: ["s15", "s11", "s7", "s13"],
              summary: "Black wide-leg trousers, cream knit vest, rust corduroy jacket, silver loafers.",
              why: "Three textures (knit, corduroy, metallic) make it interesting without being loud. Cream and rust are a warm, easy pair.",
              avoid: "Avoid sneakers here; the loafers add the dressed-up touch.",
              how: "Wear the vest on its own, no shirt underneath, for a cleaner line."
            }
          ],
          shoes: {
            reply: "Sure, swapped to your silver loafers. They're the fun detail people will notice.",
            from: "s6",
            to: "s13",
            summary: "Pleated skirt, striped top and long coat with silver loafers.",
            why: "Metallic loafers are lighter than platforms and bring a playful spark to an all-dark outfit.",
            avoid: "Avoid white socks; go bare or match socks to the skirt.",
            how: "Let the skirt hem sit mid-calf so the loafers have room."
          },
          casual: {
            reply: "Here's a more relaxed take that still feels creative.",
            title: "Creative but casual",
            items: ["s3", "s1", "s8", "s6"],
            summary: "Olive cargos, oversized black tee, red plaid overshirt, platform boots.",
            why: "The plaid is the statement, and black plus olive keep it grounded. Platforms add attitude.",
            avoid: "Avoid a graphic tee under the plaid; two busy pieces compete.",
            how: "Tie the overshirt at the waist if it gets warm inside."
          }
        },
        teach: {
          prompt: "Teach me something: how do I balance oversized pieces?",
          chips: [
            { k: "Topic", v: "balancing proportions" },
            { k: "Format", v: "quick lesson" },
            { k: "Using", v: "your closet" }
          ],
          reply: "The trick is one big shape at a time, or two big shapes with a defined middle. If the top is roomy, give the bottom some structure, and the other way round. Two examples:",
          outfits: [
            {
              title: "Big top, clean bottom",
              items: ["s1", "s10", "s6"],
              summary: "Oversized black tee with the pleated midi skirt and platform boots.",
              why: "Tucking the big tee into a skirt creates a waistline, so the volume looks chosen, not swamped.",
              avoid: "Avoid leaving a very long tee untucked over a midi; your shape disappears.",
              how: "Do a full tuck and blouse the tee out slightly."
            },
            {
              title: "Wide bottom, neat top",
              items: ["s3", "s16", "s5"],
              summary: "Olive wide-leg cargos with the fitted striped top.",
              why: "A closer-fitting top balances the wide legs, and chunky sneakers anchor the volume at the bottom.",
              avoid: "Avoid an oversized jacket on top of this; it doubles the bulk.",
              how: "Tuck the top so the cargos' waistband shows."
            }
          ],
          shoes: {
            reply: "Let's see how shoes change the balance.",
            from: "s6",
            to: "s5",
            summary: "Oversized tee and pleated skirt with chunky sneakers.",
            why: "Chunky sneakers add weight at the bottom, which balances a big top just as well as boots, but more casually.",
            avoid: "Avoid slim, flat shoes with big shapes; they can look lost.",
            how: "Match the sole thickness to the volume up top."
          },
          casual: {
            reply: "Here's the same idea in a lazy-day version.",
            title: "Relaxed balance",
            items: ["s4", "s11", "s5"],
            summary: "Light baggy jeans, cream knit vest, chunky sneakers.",
            why: "The vest is close-fitting, so the baggy jeans read relaxed rather than sloppy.",
            avoid: "Avoid an oversized tee with baggy jeans and no tuck.",
            how: "Add the canvas tote for an easy, practical finish."
          }
        },
        rooftop: {
          prompt: "Rooftop dinner Friday, it'll be windy, I want to look effortless",
          chips: [
            { k: "Occasion", v: "rooftop dinner" },
            { k: "Weather", v: "windy, evening" },
            { k: "Vibe", v: "effortless" },
            { k: "Formality", v: "smart casual" }
          ],
          reply: "Wind means trousers over a skirt tonight and a layer that won't fly open. Two looks:",
          outfits: [
            {
              title: "Long coat, easy layers",
              items: ["s15", "s16", "s12", "s6"],
              summary: "Black wide-leg trousers, striped top, long black coat, platform boots.",
              why: "The long coat is a proper wind shield and looks effortless over simple pieces. The stripe keeps all that black from feeling heavy.",
              avoid: "Skip the pleated skirt tonight; wind and pleats don't mix.",
              how: "Belt the coat loosely with its own tie if it's gusty."
            },
            {
              title: "Corduroy warmth",
              items: ["s3", "s2", "s7", "s5"],
              summary: "Olive cargos, cream graphic tee, rust corduroy jacket, chunky sneakers.",
              why: "Corduroy is warm and holds its shape in the wind. Warm earth colours feel relaxed but considered.",
              avoid: "Avoid a loose overshirt as your only layer; it'll flap around.",
              how: "Button the jacket once the sun goes down."
            }
          ],
          shoes: {
            reply: "Swapped to your silver loafers for a lighter finish.",
            from: "s6",
            to: "s13",
            summary: "Wide trousers, striped top and long coat with silver loafers.",
            why: "Silver catches the evening light and keeps an all-dark outfit from feeling heavy.",
            avoid: "Avoid sandals; feet get cold on a windy roof.",
            how: "Let the wide trousers skim the top of the loafers."
          },
          casual: {
            reply: "Here's a more casual version for a laid-back rooftop.",
            title: "Casual rooftop",
            items: ["s4", "s1", "s8", "s5"],
            summary: "Light baggy jeans, oversized black tee, plaid overshirt, chunky sneakers.",
            why: "Black and red plaid is an easy, confident pairing. It feels relaxed while still looking like an outfit.",
            avoid: "Avoid leaving the overshirt unbuttoned in strong wind.",
            how: "Button the overshirt halfway and tuck the front of the tee."
          }
        }
      }
    };
  }

  render() {
    const v = this.renderVals();
    return (
      <div className={`cm-root ${v.themeClass}`} id="top">
        <a href="#main" className="cm-skip">
          Skip to content
        </a>
        <header className={v.navClass}>
          <div className="cm-container" style={{ height: "72px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>
            <a href="#top" aria-label="ClosetMuse home" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "var(--cm-ink)" }}>
              <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
                <path d="M7 3h18a5 5 0 0 1 5 5v11a5 5 0 0 1-5 5H15l-7 5v-5H7a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5z" fill="#5B3A70" />
                <path d="M16 9.2a1.7 1.7 0 1 1 1.7 1.7c-.8.3-1.7.8-1.7 1.8v.6M16 13.3l-7.2 4.6h14.4z" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="cm-serif" style={{ fontSize: "24px", lineHeight: "1" }}>
                ClosetMuse
              </span>
            </a>
            <nav aria-label="Primary" style={{ display: "flex", alignItems: "center", gap: "32px" }}>
              <a className="cm-navlink" href="#stylist">
                Try the stylist
              </a>
              <a className="cm-navlink" href="#how">
                How it works
              </a>
              <a className="cm-navlink" href="#features">
                Features
              </a>
              <a className="cm-navlink" href="#pricing">
                Pricing
              </a>
              <a className="cm-navlink" href="#faq">
                FAQ
              </a>
              <a className="cm-navlink" href="/word2vec/">
                Word2Vec lab
              </a>
            </nav>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button type="button" className="cm-icon-btn" aria-label={v.themeLabel} onClick={v.toggleTheme}>
                {v.isLight && (
                  <>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21.75 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998z" />
                    </svg>
                  </>
                )}
                {v.isDark && (
                  <>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0z" />
                    </svg>
                  </>
                )}
              </button>
              <button type="button" className="cm-btn" onClick={v.openTrial}>
                Try free
              </button>
            </div>
          </div>
        </header>
        <main id="main">
          <section id="hero" aria-labelledby="hero-title" style={{ position: "relative", overflow: "hidden", minHeight: "88vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div className="cm-aurora" aria-hidden="true" />
            <div className="cm-container" style={{ position: "relative", width: "100%", boxSizing: "border-box", display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)", gap: "64px", alignItems: "center", paddingTop: "56px", paddingBottom: "56px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "640px" }}>
                <p className="cm-eyebrow" style={{ margin: "0" }}>
                  Your AI personal stylist
                </p>
                <h1 id="hero-title" className="cm-display" style={{ color: "var(--cm-ink)" }}>
                  <span className="cm-split-word" style={{ animationDelay: "0ms" }}>
                    Talk
                  </span>
                  {" "}
                  <span className="cm-split-word" style={{ animationDelay: "60ms" }}>
                    to
                  </span>
                  {" "}
                  <span className="cm-split-word" style={{ animationDelay: "120ms" }}>
                    a
                  </span>
                  {" "}
                  <span className="cm-split-word" style={{ animationDelay: "180ms" }}>
                    stylist
                  </span>
                  {" "}
                  <span className="cm-split-word" style={{ animationDelay: "240ms" }}>
                    who
                  </span>
                  {" "}
                  <span className="cm-split-word" style={{ animationDelay: "300ms" }}>
                    knows
                  </span>
                  {" "}
                  <span className="cm-split-word" style={{ animationDelay: "360ms" }}>
                    your
                  </span>
                  {" "}
                  <span className="cm-split-word" style={{ animationDelay: "420ms" }}>
                    closet.
                  </span>
                </h1>
                <p className="cm-h6" style={{ margin: "0", fontWeight: "400", lineHeight: "1.6", color: "var(--cm-slate)" }}>
                  Ask anything: what to wear, what goes together, what 'cocktail attire' even means. ClosetMuse builds outfits from the clothes you already own, tells you why they work, and helps you feel more confident every time you get dressed.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", paddingTop: "8px" }}>
                  <button type="button" className="cm-btn cm-btn-lg" onClick={v.openTrial}>
                    Start your free trial
                  </button>
                  <a className="cm-link" href="#stylist" style={{ fontWeight: "600" }}>
                    {"Try the stylist ↓"}
                  </a>
                </div>
                <p className="cm-caption" style={{ margin: "0", color: "var(--cm-slate)" }}>
                  14 days of full access · No credit card · iPhone & Android
                </p>
              </div>
              <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                <div className="cm-card" style={{ position: "absolute", top: "96px", left: "-8px", zIndex: "2", display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", borderRadius: "9999px" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "var(--cm-warning)" }}>
                    <path d="M10 3v1.5M4.6 5.6l1 1M15.4 5.6l-1 1M3 11h1.5M6.5 11a3.5 3.5 0 0 1 6.6-1.7" />
                    <path d="M8 20h9a3.5 3.5 0 0 0 .3-7A4.5 4.5 0 0 0 8.8 14 3 3 0 0 0 8 20z" />
                  </svg>
                  <span className="cm-small" style={{ color: "var(--cm-ink)", fontWeight: "500" }}>
                    68°F at the venue, layer suggested
                  </span>
                </div>
                <div className="cm-phone" style={{ width: "340px", height: "680px", boxSizing: "border-box" }}>
                  <div className="cm-phone-screen" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "18px 16px 12px", borderBottom: "1px solid var(--cm-border)" }}>
                      <span className="cm-avatar-stylist" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 5.5a1.75 1.75 0 1 1 1.75 1.75c-.9.3-1.75.9-1.75 1.9v.6M12 9.75 3.5 16a1 1 0 0 0 .6 1.8h15.8a1 1 0 0 0 .6-1.8z" />
                        </svg>
                      </span>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span className="cm-small" style={{ fontWeight: "600", color: "var(--cm-ink)" }}>
                          Your stylist
                        </span>
                        <span className="cm-xsmall" style={{ color: "var(--cm-slate)" }}>
                          Knows your closet
                        </span>
                      </div>
                    </div>
                    <div aria-live="polite" aria-label="Example conversation" style={{ flex: "1", minHeight: "0", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "10px", overflow: "hidden", padding: "12px" }}>
                      {v.hero.u1 && (
                        <>
                          <div className="cm-msg-in" style={{ display: "flex", justifyContent: "flex-end" }}>
                            <p className="cm-bubble-user cm-small" style={{ margin: "0", maxWidth: "82%", padding: "10px 14px" }}>
                              Cousin's wedding, cocktail attire, outdoors in October. Help?
                            </p>
                          </div>
                        </>
                      )}
                      {v.hero.t1 && (
                        <>
                          <div className="cm-msg-in" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span className="cm-avatar-stylist" aria-hidden="true" />
                            <div className="cm-bubble-stylist" style={{ padding: "12px 14px" }}>
                              <span className="cm-typing" aria-hidden="true">
                                <span className="cm-dot" />
                                <span className="cm-dot" />
                                <span className="cm-dot" />
                              </span>
                              <span className="cm-sr">
                                {"Your stylist is typing…"}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                      {v.hero.s1 && (
                        <>
                          <div className="cm-msg-in" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                              <span className="cm-avatar-stylist" aria-hidden="true" />
                              <p className="cm-bubble-stylist cm-small" style={{ margin: "0", maxWidth: "82%", padding: "10px 14px" }}>
                                {"Cocktail attire = dressier than work, not as formal as a gown. Here's a look from your closet:"}
                              </p>
                            </div>
                            <div className="cm-outfit" style={{ marginLeft: "36px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                {(v.heroOutfit1 || []).map((it, _i16) => (
                                  <React.Fragment key={(it && it.key) || _i16}>
                                    <div className="cm-item-tile" style={{ width: "50px", height: "50px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      {it.hasImg && (
                                        <>
                                          <img src={it.img} alt={it.alt} width="46" height="46" style={{ width: "46px", height: "46px", objectFit: "contain", display: "block" }} />
                                        </>
                                      )}
                                      {it.noImg && (
                                        <>
                                          <svg viewBox="0 0 64 64" width="40" height="40" role="img" aria-label={it.alt}>
                                            <path d={it.d} fill={it.color} stroke={it.stroke} strokeWidth="1.5" strokeLinejoin="round" />
                                            <path d={it.d2} fill="none" stroke={it.stroke} strokeWidth="1.5" strokeLinecap="round" />
                                          </svg>
                                        </>
                                      )}
                                    </div>
                                  </React.Fragment>
                                ))}
                              </div>
                              <p className="cm-xsmall" style={{ margin: "0", color: "var(--cm-ink)" }}>
                                <b>
                                  Why it works:
                                </b>
                                {" The knit keeps the satin from feeling like evening wear; the blazer adds structure for when the sun goes down."}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                      {v.hero.u2 && (
                        <>
                          <div className="cm-msg-in" style={{ display: "flex", justifyContent: "flex-end" }}>
                            <p className="cm-bubble-user cm-small" style={{ margin: "0", maxWidth: "82%", padding: "10px 14px" }}>
                              Can you swap the shoes? I can't walk in heels on grass.
                            </p>
                          </div>
                        </>
                      )}
                      {v.hero.t2 && (
                        <>
                          <div className="cm-msg-in" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span className="cm-avatar-stylist" aria-hidden="true" />
                            <div className="cm-bubble-stylist" style={{ padding: "12px 14px" }}>
                              <span className="cm-typing" aria-hidden="true">
                                <span className="cm-dot" />
                                <span className="cm-dot" />
                                <span className="cm-dot" />
                              </span>
                              <span className="cm-sr">
                                {"Your stylist is typing…"}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                      {v.hero.s2 && (
                        <>
                          <div className="cm-msg-in" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                              <span className="cm-avatar-stylist" aria-hidden="true" />
                              <p className="cm-bubble-stylist cm-small" style={{ margin: "0", maxWidth: "82%", padding: "10px 14px" }}>
                                Done: your tan block-heel sandals. A block heel won't sink.
                              </p>
                            </div>
                            <div className="cm-outfit" style={{ marginLeft: "36px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                              <span className="cm-badge" style={{ alignSelf: "flex-start" }}>
                                Updated look
                              </span>
                              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                {(v.heroOutfit2 || []).map((it, _i16) => (
                                  <React.Fragment key={(it && it.key) || _i16}>
                                    <div className="cm-item-tile" style={{ width: "50px", height: "50px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      {it.hasImg && (
                                        <>
                                          <img src={it.img} alt={it.alt} width="46" height="46" style={{ width: "46px", height: "46px", objectFit: "contain", display: "block" }} />
                                        </>
                                      )}
                                      {it.noImg && (
                                        <>
                                          <svg viewBox="0 0 64 64" width="40" height="40" role="img" aria-label={it.alt}>
                                            <path d={it.d} fill={it.color} stroke={it.stroke} strokeWidth="1.5" strokeLinejoin="round" />
                                            <path d={it.d2} fill="none" stroke={it.stroke} strokeWidth="1.5" strokeLinecap="round" />
                                          </svg>
                                        </>
                                      )}
                                    </div>
                                  </React.Fragment>
                                ))}
                              </div>
                              <p className="cm-xsmall" style={{ margin: "0", color: "var(--cm-ink)" }}>
                                <b>
                                  Why it works:
                                </b>
                                {" A block heel gives you height without sinking into the grass."}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div style={{ padding: "10px 12px 16px", borderTop: "1px solid var(--cm-border)" }} aria-hidden="true">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", height: "44px", padding: "0 6px 0 16px", borderRadius: "9999px", background: "var(--cm-mist)", color: "var(--cm-slate)" }}>
                        <span className="cm-small">
                          {"Ask your stylist…"}
                        </span>
                        <span style={{ width: "34px", height: "34px", borderRadius: "9999px", background: "var(--cm-aubergine)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {v.heroDone && (
                  <>
                    <button type="button" className="cm-link" onClick={v.heroReplay} style={{ background: "none", border: "0", padding: "8px 4px", font: "inherit", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                      </svg>
                      Replay conversation
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="cm-marquee" role="region" aria-label="Things people ask their stylist" style={{ position: "relative", padding: "20px 0 32px" }}>
              <div className="cm-marquee-track" style={{ display: "flex" }}>
                <ul style={{ display: "flex", gap: "12px", listStyle: "none", margin: "0", padding: "0 6px", background: "none", border: "0", borderRadius: "0" }}>
                  <li className="cm-small" style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "9999px", background: "var(--cm-surface)", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                    What does cocktail attire mean?
                  </li>
                  <li className="cm-small" style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "9999px", background: "var(--cm-surface)", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                    Swap the shoes
                  </li>
                  <li className="cm-small" style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "9999px", background: "var(--cm-surface)", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                    Something more casual
                  </li>
                  <li className="cm-small" style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "9999px", background: "var(--cm-surface)", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                    Rooftop dinner, windy
                  </li>
                  <li className="cm-small" style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "9999px", background: "var(--cm-surface)", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                    What does smart casual even mean?
                  </li>
                  <li className="cm-small" style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "9999px", background: "var(--cm-surface)", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                    What goes with my green skirt?
                  </li>
                  <li className="cm-small" style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "9999px", background: "var(--cm-surface)", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                    Is this too much for a work dinner?
                  </li>
                  <li className="cm-small" style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "9999px", background: "var(--cm-surface)", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                    No, not that jacket
                  </li>
                </ul>
                <ul aria-hidden="true" style={{ display: "flex", gap: "12px", listStyle: "none", margin: "0", padding: "0 6px", background: "none", border: "0", borderRadius: "0" }}>
                  <li className="cm-small" style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "9999px", background: "var(--cm-surface)", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                    What does cocktail attire mean?
                  </li>
                  <li className="cm-small" style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "9999px", background: "var(--cm-surface)", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                    Swap the shoes
                  </li>
                  <li className="cm-small" style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "9999px", background: "var(--cm-surface)", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                    Something more casual
                  </li>
                  <li className="cm-small" style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "9999px", background: "var(--cm-surface)", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                    Rooftop dinner, windy
                  </li>
                  <li className="cm-small" style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "9999px", background: "var(--cm-surface)", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                    What does smart casual even mean?
                  </li>
                  <li className="cm-small" style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "9999px", background: "var(--cm-surface)", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                    What goes with my green skirt?
                  </li>
                  <li className="cm-small" style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "9999px", background: "var(--cm-surface)", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                    Is this too much for a work dinner?
                  </li>
                  <li className="cm-small" style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "9999px", background: "var(--cm-surface)", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                    No, not that jacket
                  </li>
                </ul>
              </div>
            </div>
          </section>
          <section id="problem" className="cm-section cm-section-mist" aria-labelledby="problem-title">
            <div className="cm-container" style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
              <div className="cm-reveal" style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", textAlign: "center", maxWidth: "760px", margin: "0 auto" }}>
                <p className="cm-eyebrow" style={{ margin: "0" }}>
                  Sound familiar?
                </p>
                <h2 id="problem-title" className="cm-h2" style={{ color: "var(--cm-ink)" }}>
                  Getting dressed is harder than it should be.
                </h2>
                <p className="cm-h6" style={{ margin: "0", fontWeight: "400", color: "var(--cm-slate)" }}>
                  You're not alone, and it's not your fault. If any of these sound like you, this is exactly the problem ClosetMuse was built to fix.
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "24px" }}>
                <article className="cm-card cm-reveal" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <span className="cm-icon-circle" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
                    </svg>
                  </span>
                  <h3 className="cm-h5" style={{ color: "var(--cm-ink)", fontWeight: "600" }}>
                    {"\"I have nothing to wear.\""}
                  </h3>
                  <p className="cm-body" style={{ margin: "0", color: "var(--cm-slate)" }}>
                    Your closet is packed, yet you keep reaching for the same three safe outfits because you can't see what else goes together.
                  </p>
                </article>
                <article className="cm-card cm-reveal" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "16px", animationDelay: "80ms" }}>
                  <span className="cm-icon-circle" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                  </span>
                  <h3 className="cm-h5" style={{ color: "var(--cm-ink)", fontWeight: "600" }}>
                    {"\"Is this too much? Or not enough?\""}
                  </h3>
                  <p className="cm-body" style={{ margin: "0", color: "var(--cm-slate)" }}>
                    {"An invite says \"cocktail\" or \"smart casual,\" and you spend the night before googling and second-guessing every option."}
                  </p>
                </article>
                <article className="cm-card cm-reveal" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "16px", animationDelay: "160ms" }}>
                  <span className="cm-icon-circle" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                  </span>
                  <h3 className="cm-h5" style={{ color: "var(--cm-ink)", fontWeight: "600" }}>
                    {"\"Can someone just tell me if this works?\""}
                  </h3>
                  <p className="cm-body" style={{ margin: "0", color: "var(--cm-slate)" }}>
                    You text mirror selfies to friends and wait for a thumbs-up before you feel okay walking out the door.
                  </p>
                </article>
              </div>
              <p className="cm-h5 cm-reveal" style={{ margin: "0", textAlign: "center", color: "var(--cm-ink)" }}>
                {"It's not that you're \"not a fashion person.\" Nobody ever explained the "}
                <em>
                  why
                </em>
                . That's what ClosetMuse is for.
              </p>
            </div>
          </section>
          <section id="solution" className="cm-section" aria-labelledby="solution-title">
            <div className="cm-container" style={{ display: "flex", flexDirection: "column", gap: "56px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "64px", alignItems: "end" }}>
                <h2 id="solution-title" className="cm-h2 cm-reveal" style={{ color: "var(--cm-ink)" }}>
                  A stylish friend who knows your closet, and explains everything.
                </h2>
                <div className="cm-reveal" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <p className="cm-body" style={{ margin: "0", fontSize: "18px", color: "var(--cm-slate)" }}>
                    Add your clothes to ClosetMuse, tell it a little about you, then ask it anything. It builds outfits from what you own, explains why they work, adjusts when you push back, and answers the questions you've been too embarrassed to ask. Every conversation makes you a little more confident on your own.
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ display: "flex" }} aria-hidden="true">
                      <span style={{ width: "48px", height: "48px", borderRadius: "9999px", overflow: "hidden", display: "block", border: "2px solid var(--cm-bg)" }}>
                        <svg viewBox="0 0 48 48" width="48" height="48">
                          <rect width="48" height="48" fill="#F6E3C6" />
                          <path d="M12 22c0-9 5-14 12-14s12 5 12 14v14H12z" fill="#3B2418" />
                          <path d="M8 48c1-8 7-12 16-12s15 4 16 12z" fill="#C19A6B" />
                          <rect x="21" y="28" width="6" height="8" fill="#B47D55" />
                          <ellipse cx="24" cy="22" rx="7" ry="8.5" fill="#C68E64" />
                          <path d="M16.5 20c1-6 5-8.5 8-8.5 4 0 7 3 7.5 8-3-2.5-9-3-15.5.5z" fill="#3B2418" />
                        </svg>
                      </span>
                      <span style={{ width: "48px", height: "48px", borderRadius: "9999px", overflow: "hidden", display: "block", border: "2px solid var(--cm-bg)", marginLeft: "-12px" }}>
                        <svg viewBox="0 0 48 48" width="48" height="48">
                          <rect width="48" height="48" fill="#F6E3C6" />
                          <path d="M4 48c1-9 9-13 20-13s19 4 20 13z" fill="#24335A" />
                          <rect x="20.5" y="27" width="7" height="9" fill="#5A361E" />
                          <ellipse cx="24" cy="21" rx="8" ry="9" fill="#6B4226" />
                          <path d="M16 17c0-5 3.5-7.5 8-7.5s8 2.5 8 7.5c-2-2-5-3-8-3s-6 1-8 3z" fill="#9A9A9E" />
                          <path d="M16.5 23c0 6 3.5 9 7.5 9s7.5-3 7.5-9c-1.5 2.5-4 3.5-7.5 3.5S18 25.5 16.5 23z" fill="#B5B5B8" />
                        </svg>
                      </span>
                      <span style={{ width: "48px", height: "48px", borderRadius: "9999px", overflow: "hidden", display: "block", border: "2px solid var(--cm-bg)", marginLeft: "-12px" }}>
                        <svg viewBox="0 0 48 48" width="48" height="48">
                          <rect width="48" height="48" fill="#F6E3C6" />
                          <path d="M5 48c0-8 8-13 19-13s19 5 19 13z" fill="#9C5A34" />
                          <rect x="20.5" y="28" width="7" height="8" fill="#E2B48E" />
                          <ellipse cx="24" cy="22" rx="8.5" ry="8.5" fill="#F1C9A5" />
                          <path d="M15 20c0-6 4-10 9.5-10 5 0 9 3.5 9 8-3-1-6-3.5-7-5-2 3-7 5-11.5 7z" fill="#2F8F8A" />
                        </svg>
                      </span>
                    </div>
                    <p className="cm-small" style={{ margin: "0", color: "var(--cm-slate)" }}>
                      It works from your closet, your style profile and your feedback, not a trend board.
                    </p>
                  </div>
                </div>
              </div>
              <div className="cm-reveal" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0", textAlign: "left", tableLayout: "fixed" }}>
                  <caption className="cm-sr">
                    How ClosetMuse compares with capsule wardrobes, styling boxes and typical closet apps
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" className="cm-h6" style={{ padding: "20px 24px", color: "var(--cm-ink)", borderBottom: "1px solid var(--cm-border)" }}>
                        Capsule wardrobes
                      </th>
                      <th scope="col" className="cm-h6" style={{ padding: "20px 24px", color: "var(--cm-ink)", borderBottom: "1px solid var(--cm-border)" }}>
                        Styling boxes
                      </th>
                      <th scope="col" className="cm-h6" style={{ padding: "20px 24px", color: "var(--cm-ink)", borderBottom: "1px solid var(--cm-border)" }}>
                        Typical closet apps
                      </th>
                      <th scope="col" className="cm-h6" style={{ padding: "20px 24px", color: "var(--cm-ink)", background: "var(--cm-highlight)", border: "2px solid var(--cm-aubergine)", borderBottom: "1px solid var(--cm-border)", borderRadius: "16px 16px 0 0" }}>
                        <span className="cm-serif" style={{ fontSize: "24px", fontWeight: "400" }}>
                          ClosetMuse
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="cm-body" style={{ padding: "18px 24px", color: "var(--cm-slate)", borderBottom: "1px solid var(--cm-border)" }}>
                        <span style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <svg className="cm-cross" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                          Start by buying a new set
                        </span>
                      </td>
                      <td className="cm-body" style={{ padding: "18px 24px", color: "var(--cm-slate)", borderBottom: "1px solid var(--cm-border)" }}>
                        <span style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <svg className="cm-cross" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                          Pick new clothes for you
                        </span>
                      </td>
                      <td className="cm-body" style={{ padding: "18px 24px", color: "var(--cm-slate)", borderBottom: "1px solid var(--cm-border)" }}>
                        <span style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <svg className="cm-cross" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                          Random combinations
                        </span>
                      </td>
                      <td className="cm-body" style={{ padding: "18px 24px", color: "var(--cm-ink)", fontWeight: "600", background: "var(--cm-highlight)", borderLeft: "2px solid var(--cm-aubergine)", borderRight: "2px solid var(--cm-aubergine)", borderBottom: "1px solid var(--cm-border)" }}>
                        <span style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <svg className="cm-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                            <path d="M5 12.5 9.5 17 19 7" />
                          </svg>
                          Starts with clothes you own
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="cm-body" style={{ padding: "18px 24px", color: "var(--cm-slate)", borderBottom: "1px solid var(--cm-border)" }}>
                        <span style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <svg className="cm-cross" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                          No help combining pieces
                        </span>
                      </td>
                      <td className="cm-body" style={{ padding: "18px 24px", color: "var(--cm-slate)", borderBottom: "1px solid var(--cm-border)" }}>
                        <span style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <svg className="cm-cross" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                          No explanation
                        </span>
                      </td>
                      <td className="cm-body" style={{ padding: "18px 24px", color: "var(--cm-slate)", borderBottom: "1px solid var(--cm-border)" }}>
                        <span style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <svg className="cm-cross" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                          No explanation
                        </span>
                      </td>
                      <td className="cm-body" style={{ padding: "18px 24px", color: "var(--cm-ink)", fontWeight: "600", background: "var(--cm-highlight)", borderLeft: "2px solid var(--cm-aubergine)", borderRight: "2px solid var(--cm-aubergine)", borderBottom: "1px solid var(--cm-border)" }}>
                        <span style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <svg className="cm-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                            <path d="M5 12.5 9.5 17 19 7" />
                          </svg>
                          Explains why every outfit works
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="cm-body" style={{ padding: "18px 24px", color: "var(--cm-slate)", borderBottom: "1px solid var(--cm-border)" }}>
                        <span style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <svg className="cm-cross" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                          One-size-fits-all rules
                        </span>
                      </td>
                      <td className="cm-body" style={{ padding: "18px 24px", color: "var(--cm-slate)", borderBottom: "1px solid var(--cm-border)" }}>
                        <span style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <svg className="cm-cross" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                          Wait for the next box
                        </span>
                      </td>
                      <td className="cm-body" style={{ padding: "18px 24px", color: "var(--cm-slate)", borderBottom: "1px solid var(--cm-border)" }}>
                        <span style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <svg className="cm-cross" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                          No follow-up
                        </span>
                      </td>
                      <td className="cm-body" style={{ padding: "18px 24px", color: "var(--cm-ink)", fontWeight: "600", background: "var(--cm-highlight)", borderLeft: "2px solid var(--cm-aubergine)", borderRight: "2px solid var(--cm-aubergine)", borderBottom: "1px solid var(--cm-border)" }}>
                        <span style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <svg className="cm-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                            <path d="M5 12.5 9.5 17 19 7" />
                          </svg>
                          Ask follow-ups anytime
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="cm-body" style={{ padding: "18px 24px", color: "var(--cm-slate)" }}>
                        <span style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <svg className="cm-cross" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                          Ignores the occasion
                        </span>
                      </td>
                      <td className="cm-body" style={{ padding: "18px 24px", color: "var(--cm-slate)" }}>
                        <span style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <svg className="cm-cross" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                          Costly per box
                        </span>
                      </td>
                      <td className="cm-body" style={{ padding: "18px 24px", color: "var(--cm-slate)" }}>
                        <span style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <svg className="cm-cross" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                          Ignores occasion and weather
                        </span>
                      </td>
                      <td className="cm-body" style={{ padding: "18px 24px", color: "var(--cm-ink)", fontWeight: "600", background: "var(--cm-highlight)", border: "2px solid var(--cm-aubergine)", borderTop: "0", borderRadius: "0 0 16px 16px" }}>
                        <span style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <svg className="cm-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                            <path d="M5 12.5 9.5 17 19 7" />
                          </svg>
                          Dress codes, venues and weather
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          <section id="stylist" className="cm-section cm-section-mist" aria-labelledby="stylist-title" style={{ position: "relative" }}>
            <div className="cm-container" style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", textAlign: "center", maxWidth: "720px", margin: "0 auto" }}>
                <p className="cm-eyebrow" style={{ margin: "0" }}>
                  Try it now
                </p>
                <h2 id="stylist-title" className="cm-h1" style={{ color: "var(--cm-ink)" }}>
                  Ask it anything. Really.
                </h2>
                <p className="cm-h6" style={{ margin: "0", fontWeight: "400", lineHeight: "1.6", color: "var(--cm-slate)" }}>
                  Try the stylist with a sample closet. Describe where you're going, the weather and the vibe, in your own words.
                </p>
              </div>
              <div className="cm-card" style={{ display: "grid", gridTemplateColumns: "360px minmax(0, 1fr)", overflow: "hidden", padding: "0", border: "1px solid var(--cm-border)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "32px", background: "var(--cm-bg)", borderRight: "1px solid var(--cm-border)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <h3 className="cm-h6" style={{ color: "var(--cm-ink)", fontWeight: "600" }}>
                      Choose a sample closet
                    </h3>
                    <div role="group" aria-label="Sample closet" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {(v.closets || []).map((c, _i11) => (
                        <React.Fragment key={(c && c.key) || _i11}>
                          <button type="button" className="cm-chip" aria-pressed={c.pressed} onClick={c.select} style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "12px", width: "100%", padding: "8px 16px 8px 8px", borderRadius: "16px", textAlign: "left" }}>
                            <span aria-hidden="true" style={{ width: "48px", height: "48px", flex: "none", borderRadius: "9999px", overflow: "hidden", display: "block" }}>
                              {c.isNikki && (
                                <>
                                  <svg viewBox="0 0 48 48" width="48" height="48">
                                    <rect width="48" height="48" fill="#F6E3C6" />
                                    <path d="M12 22c0-9 5-14 12-14s12 5 12 14v14H12z" fill="#3B2418" />
                                    <path d="M8 48c1-8 7-12 16-12s15 4 16 12z" fill="#C19A6B" />
                                    <rect x="21" y="28" width="6" height="8" fill="#B47D55" />
                                    <ellipse cx="24" cy="22" rx="7" ry="8.5" fill="#C68E64" />
                                    <path d="M16.5 20c1-6 5-8.5 8-8.5 4 0 7 3 7.5 8-3-2.5-9-3-15.5.5z" fill="#3B2418" />
                                  </svg>
                                </>
                              )}
                              {c.isMarcus && (
                                <>
                                  <svg viewBox="0 0 48 48" width="48" height="48">
                                    <rect width="48" height="48" fill="#F6E3C6" />
                                    <path d="M4 48c1-9 9-13 20-13s19 4 20 13z" fill="#24335A" />
                                    <rect x="20.5" y="27" width="7" height="9" fill="#5A361E" />
                                    <ellipse cx="24" cy="21" rx="8" ry="9" fill="#6B4226" />
                                    <path d="M16 17c0-5 3.5-7.5 8-7.5s8 2.5 8 7.5c-2-2-5-3-8-3s-6 1-8 3z" fill="#9A9A9E" />
                                    <path d="M16.5 23c0 6 3.5 9 7.5 9s7.5-3 7.5-9c-1.5 2.5-4 3.5-7.5 3.5S18 25.5 16.5 23z" fill="#B5B5B8" />
                                  </svg>
                                </>
                              )}
                              {c.isSam && (
                                <>
                                  <svg viewBox="0 0 48 48" width="48" height="48">
                                    <rect width="48" height="48" fill="#F6E3C6" />
                                    <path d="M5 48c0-8 8-13 19-13s19 5 19 13z" fill="#9C5A34" />
                                    <rect x="20.5" y="28" width="7" height="8" fill="#E2B48E" />
                                    <ellipse cx="24" cy="22" rx="8.5" ry="8.5" fill="#F1C9A5" />
                                    <path d="M15 20c0-6 4-10 9.5-10 5 0 9 3.5 9 8-3-1-6-3.5-7-5-2 3-7 5-11.5 7z" fill="#2F8F8A" />
                                  </svg>
                                </>
                              )}
                            </span>
                            <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "0" }}>
                              <span style={{ fontWeight: "600", fontSize: "15px" }}>
                                {c.name}
                              </span>
                              <span className="cm-xsmall">
                                {c.who}{" · "}{c.desc}
                              </span>
                            </span>
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight: "0" }}>
                    <p className="cm-caption" style={{ margin: "0", color: "var(--cm-slate)" }}>
                      {"Sample closet · "}{v.activeCloset.countLabel}
                    </p>
                    <div role="region" aria-label="Items in the selected sample closet" tabIndex="0" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", maxHeight: "452px", overflowY: "auto", padding: "4px 4px 4px 0" }}>
                      {(v.activeCloset.items || []).map((it, _i11) => (
                        <React.Fragment key={(it && it.key) || _i11}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center", textAlign: "center" }}>
                            <div className="cm-item-tile" style={{ width: "88px", height: "88px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {it.hasImg && (
                                <>
                                  <img src={it.img} alt={it.alt} width="80" height="80" style={{ width: "80px", height: "80px", objectFit: "contain", display: "block" }} />
                                </>
                              )}
                              {it.noImg && (
                                <>
                                  <svg viewBox="0 0 64 64" width="64" height="64" role="img" aria-label={it.alt}>
                                    <path d={it.d} fill={it.color} stroke={it.stroke} strokeWidth="1.5" strokeLinejoin="round" />
                                    <path d={it.d2} fill="none" stroke={it.stroke} strokeWidth="1.5" strokeLinecap="round" />
                                  </svg>
                                </>
                              )}
                            </div>
                            <span className="cm-xsmall" style={{ color: "var(--cm-slate)" }}>
                              {it.name}
                            </span>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <p className="cm-xsmall" style={{ margin: "0", color: "var(--cm-slate)" }}>
                    What you type here isn't stored.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", minHeight: "760px", background: "var(--cm-surface)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px 32px", borderBottom: "1px solid var(--cm-border)" }}>
                    <span className="cm-avatar-stylist" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5.5a1.75 1.75 0 1 1 1.75 1.75c-.9.3-1.75.9-1.75 1.9v.6M12 9.75 3.5 16a1 1 0 0 0 .6 1.8h15.8a1 1 0 0 0 .6-1.8z" />
                      </svg>
                    </span>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span className="cm-body" style={{ fontWeight: "600", color: "var(--cm-ink)" }}>
                        Your stylist
                      </span>
                      <span className="cm-xsmall" style={{ color: "var(--cm-slate)" }}>
                        {"Styling from "}{v.activeCloset.name}
                      </span>
                    </div>
                  </div>
                  <div className="cm-thread" aria-live="polite" aria-label="Conversation with your stylist" style={{ flex: "1", padding: "28px 32px", overflowY: "auto", maxHeight: "820px" }}>
                    {v.demoEmpty && (
                      <>
                        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                          <span className="cm-avatar-stylist" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 5.5a1.75 1.75 0 1 1 1.75 1.75c-.9.3-1.75.9-1.75 1.9v.6M12 9.75 3.5 16a1 1 0 0 0 .6 1.8h15.8a1 1 0 0 0 .6-1.8z" />
                            </svg>
                          </span>
                          <p className="cm-bubble-stylist cm-body" style={{ margin: "0", padding: "12px 16px", maxWidth: "80%" }}>
                            Pick a quick start or describe where you're going.
                          </p>
                        </div>
                      </>
                    )}
                    {(v.demoMessages || []).map((m, _i10) => (
                      <React.Fragment key={(m && m.key) || _i10}>
                        {m.isUser && (
                          <>
                            <div className="cm-msg-in" style={{ display: "flex", justifyContent: "flex-end" }}>
                              <p className="cm-bubble-user cm-body" style={{ margin: "0", maxWidth: "72%", padding: "12px 16px" }}>
                                {m.text}
                              </p>
                            </div>
                          </>
                        )}
                        {m.isStylist && (
                          <>
                            <div className="cm-msg-in" style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                              <span className="cm-avatar-stylist" aria-hidden="true">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 5.5a1.75 1.75 0 1 1 1.75 1.75c-.9.3-1.75.9-1.75 1.9v.6M12 9.75 3.5 16a1 1 0 0 0 .6 1.8h15.8a1 1 0 0 0 .6-1.8z" />
                                </svg>
                              </span>
                              <div style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "16px" }}>
                                <p className="cm-bubble-stylist cm-body" style={{ margin: "0", padding: "12px 16px", maxWidth: "88%", alignSelf: "flex-start" }}>
                                  {m.text}
                                </p>
                                {m.hasChips && (
                                  <>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                      <p className="cm-caption" style={{ margin: "0", color: "var(--cm-slate)" }}>
                                        What I understood
                                      </p>
                                      <ul style={{ listStyle: "none", margin: "0", padding: "0", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                        {(m.chips || []).map((ch, _i20) => (
                                          <React.Fragment key={(ch && ch.key) || _i20}>
                                            <li className="cm-understood">
                                              <b>
                                                {ch.k}:
                                              </b>
                                              {" "}{ch.v}
                                            </li>
                                          </React.Fragment>
                                        ))}
                                      </ul>
                                    </div>
                                  </>
                                )}
                                {m.hasOutfits && (
                                  <>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px", alignItems: "start" }}>
                                      {(m.outfits || []).map((o, _i19) => (
                                        <React.Fragment key={(o && o.key) || _i19}>
                                          <article className="cm-outfit" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                                {(o.items || []).map((it, _i24) => (
                                                  <React.Fragment key={(it && it.key) || _i24}>
                                                    <div className="cm-item-tile" style={{ width: "56px", height: "56px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                      {it.hasImg && (
                                                        <>
                                                          <img src={it.img} alt={it.alt} width="52" height="52" style={{ width: "52px", height: "52px", objectFit: "contain", display: "block" }} />
                                                        </>
                                                      )}
                                                      {it.noImg && (
                                                        <>
                                                          <svg viewBox="0 0 64 64" width="44" height="44" role="img" aria-label={it.alt}>
                                                            <path d={it.d} fill={it.color} stroke={it.stroke} strokeWidth="1.5" strokeLinejoin="round" />
                                                            <path d={it.d2} fill="none" stroke={it.stroke} strokeWidth="1.5" strokeLinecap="round" />
                                                          </svg>
                                                        </>
                                                      )}
                                                    </div>
                                                  </React.Fragment>
                                                ))}
                                              </div>
                                              <button type="button" className={o.heartClass} onClick={o.save} aria-label={o.heartLabel} style={{ position: "relative", flex: "none" }}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                                </svg>
                                                {o.saved && (
                                                  <>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
                                                      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                                    </svg>
                                                  </>
                                                )}
                                              </button>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                              {m.isUpdate && (
                                                <>
                                                  <span className="cm-badge" style={{ alignSelf: "flex-start" }}>
                                                    Updated
                                                  </span>
                                                </>
                                              )}
                                              <h4 className="cm-h6" style={{ margin: "0", fontWeight: "600", color: "var(--cm-ink)" }}>
                                                {o.title}
                                              </h4>
                                              <p className="cm-small" style={{ margin: "0", color: "var(--cm-slate)" }}>
                                                {o.summary}
                                              </p>
                                            </div>
                                            <button type="button" className="cm-why-btn" aria-expanded={o.ariaExpanded} aria-controls={o.panelId} onClick={o.toggle} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                              {o.toggleLabel}
                                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                              </svg>
                                            </button>
                                            {o.open && (
                                              <>
                                                <div id={o.panelId} style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "12px", borderTop: "1px solid var(--cm-border)" }}>
                                                  <div>
                                                    <p className="cm-caption" style={{ margin: "0", color: "var(--cm-accent)" }}>
                                                      Why it works
                                                    </p>
                                                    <p className="cm-small" style={{ margin: "4px 0 0", color: "var(--cm-ink)" }}>
                                                      {o.why}
                                                    </p>
                                                  </div>
                                                  <div>
                                                    <p className="cm-caption" style={{ margin: "0", color: "var(--cm-accent)" }}>
                                                      What to avoid
                                                    </p>
                                                    <p className="cm-small" style={{ margin: "4px 0 0", color: "var(--cm-ink)" }}>
                                                      {o.avoid}
                                                    </p>
                                                  </div>
                                                  <div>
                                                    <p className="cm-caption" style={{ margin: "0", color: "var(--cm-accent)" }}>
                                                      How to wear it
                                                    </p>
                                                    <p className="cm-small" style={{ margin: "4px 0 0", color: "var(--cm-ink)" }}>
                                                      {o.how}
                                                    </p>
                                                  </div>
                                                </div>
                                              </>
                                            )}
                                          </article>
                                        </React.Fragment>
                                      ))}
                                    </div>
                                  </>
                                )}
                                {m.hasNote && (
                                  <>
                                    <p className="cm-xsmall" style={{ margin: "0", color: "var(--cm-slate)" }}>
                                      {m.note}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </React.Fragment>
                    ))}
                    {v.demoTyping && (
                      <>
                        <div className="cm-msg-in" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <span className="cm-avatar-stylist" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 5.5a1.75 1.75 0 1 1 1.75 1.75c-.9.3-1.75.9-1.75 1.9v.6M12 9.75 3.5 16a1 1 0 0 0 .6 1.8h15.8a1 1 0 0 0 .6-1.8z" />
                            </svg>
                          </span>
                          <div className="cm-bubble-stylist" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px" }}>
                            <span className="cm-typing" aria-hidden="true">
                              <span className="cm-dot" />
                              <span className="cm-dot" />
                              <span className="cm-dot" />
                            </span>
                            <span className="cm-small">
                              {"Your stylist is typing…"}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ padding: "20px 32px 28px", borderTop: "1px solid var(--cm-border)", display: "flex", flexDirection: "column", gap: "14px", background: "var(--cm-surface)" }}>
                    {v.showQuickChips && (
                      <>
                        <div role="group" aria-label="Quick starts" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {(v.quickChips || []).map((q, _i13) => (
                            <React.Fragment key={(q && q.key) || _i13}>
                              <button type="button" className="cm-chip" onClick={q.run} disabled={v.demoBusy}>
                                {q.label}
                              </button>
                            </React.Fragment>
                          ))}
                        </div>
                      </>
                    )}
                    {v.showFollowHint && (
                      <>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <p className="cm-small" style={{ margin: "0", color: "var(--cm-ink)" }}>
                            Want to change anything? Try 'swap the shoes' or 'more casual.'
                          </p>
                          <div role="group" aria-label="Suggested follow-ups" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {(v.followChips || []).map((q, _i14) => (
                              <React.Fragment key={(q && q.key) || _i14}>
                                <button type="button" className="cm-chip" onClick={q.run} disabled={v.demoBusy}>
                                  {q.label}
                                </button>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    {v.showComposer && (
                      <>
                        <form onSubmit={v.onDemoSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <label htmlFor="cm-demo-input" className="cm-caption" style={{ color: "var(--cm-ink)" }}>
                            {v.composerLabel}
                          </label>
                          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                            <textarea id="cm-demo-input" className="cm-textarea" rows="2" maxLength="300" value={v.demoInput} onChange={v.onDemoInput} onKeyDown={v.onDemoKey} placeholder={v.demoPlaceholder} style={{ flex: "1", minWidth: "0", resize: "none" }} />
                            <button type="submit" className="cm-btn" aria-label="Send" disabled={v.demoBusy} style={{ width: "52px", height: "52px", padding: "0", flex: "none", borderRadius: "9999px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12zm0 0h7.5" />
                              </svg>
                            </button>
                          </div>
                          <p className="cm-xsmall" style={{ margin: "0", textAlign: "right", color: "var(--cm-slate)" }}>
                            {v.demoCount}
                          </p>
                        </form>
                      </>
                    )}
                    {v.showTrialPrompt && (
                      <>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap", padding: "20px 24px", borderRadius: "16px", background: "var(--cm-highlight)" }}>
                          <p className="cm-h6" style={{ margin: "0", color: "var(--cm-ink)" }}>
                            {"Want to keep going with "}
                            <em>
                              your
                            </em>
                            {" closet? Start your free trial."}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <button type="button" className="cm-link" onClick={v.demoReset} style={{ background: "none", border: "0", padding: "8px 4px", font: "inherit", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                              Try another request
                            </button>
                            <button type="button" className="cm-btn" onClick={v.openTrial}>
                              Start your free trial
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section id="features" className="cm-section" aria-labelledby="features-title">
            <div className="cm-container" style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "720px" }}>
                <p className="cm-eyebrow" style={{ margin: "0" }}>
                  Available now
                </p>
                <h2 id="features-title" className="cm-h2" style={{ color: "var(--cm-ink)" }}>
                  What you get
                </h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "24px" }}>
                <article className="cm-card cm-spotlight cm-reveal" style={{ gridColumn: "span 2", padding: "40px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "32px", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <span className="cm-icon-circle" aria-hidden="true">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                    </span>
                    <h3 className="cm-h4" style={{ color: "var(--cm-ink)" }}>
                      A stylist you can talk to
                    </h3>
                    <p className="cm-small" style={{ margin: "0", color: "var(--cm-slate)" }}>
                      Ask follow-ups, push back, get dress-code and venue advice, or ask any fashion question.
                    </p>
                  </div>
                  <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <p className="cm-bubble-user cm-small" style={{ margin: "0", padding: "10px 14px", alignSelf: "flex-end", maxWidth: "90%" }}>
                      What does smart casual even mean?
                    </p>
                    <p className="cm-bubble-stylist cm-small" style={{ margin: "0", padding: "10px 14px", alignSelf: "flex-start", maxWidth: "90%" }}>
                      Think one step up from jeans and a tee: a collar, a structured layer, or a nicer shoe.
                    </p>
                    <p className="cm-bubble-user cm-small" style={{ margin: "0", padding: "10px 14px", alignSelf: "flex-end", maxWidth: "90%" }}>
                      Something more casual?
                    </p>
                  </div>
                </article>
                <article className="cm-card cm-spotlight cm-reveal" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <span className="cm-icon-circle" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                  </span>
                  <h3 className="cm-h4" style={{ color: "var(--cm-ink)" }}>
                    Learn why it works
                  </h3>
                  <p className="cm-small" style={{ margin: "0", color: "var(--cm-slate)" }}>
                    Every outfit comes with the reasons (color, proportion, formality, fit), plus what to avoid.
                  </p>
                </article>
                <article className="cm-card cm-spotlight cm-reveal" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <span className="cm-icon-circle" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5.5a1.75 1.75 0 1 1 1.75 1.75c-.9.3-1.75.9-1.75 1.9v.6M12 9.75 3.5 16a1 1 0 0 0 .6 1.8h15.8a1 1 0 0 0 .6-1.8z" />
                    </svg>
                  </span>
                  <h3 className="cm-h4" style={{ color: "var(--cm-ink)" }}>
                    Your real closet
                  </h3>
                  <p className="cm-small" style={{ margin: "0", color: "var(--cm-slate)" }}>
                    Add pieces one photo at a time (we remove the background and fill in the details) or paste a store link.
                  </p>
                </article>
                <article className="cm-card cm-spotlight cm-reveal" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <span className="cm-icon-circle" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </span>
                  <h3 className="cm-h4" style={{ color: "var(--cm-ink)" }}>
                    Your Lookbook
                  </h3>
                  <p className="cm-small" style={{ margin: "0", color: "var(--cm-slate)" }}>
                    Outfit cards use photos of your actual clothes. Save the ones you love in one tap.
                  </p>
                </article>
                <article className="cm-card cm-spotlight cm-reveal" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <span className="cm-icon-circle" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 3v1.5M4.6 5.6l1 1M15.4 5.6l-1 1M3 11h1.5M6.5 11a3.5 3.5 0 0 1 6.6-1.7" />
                      <path d="M8 20h9a3.5 3.5 0 0 0 .3-7A4.5 4.5 0 0 0 8.8 14 3 3 0 0 0 8 20z" />
                    </svg>
                  </span>
                  <h3 className="cm-h4" style={{ color: "var(--cm-ink)" }}>
                    Knows you and your weather
                  </h3>
                  <p className="cm-small" style={{ margin: "0", color: "var(--cm-slate)" }}>
                    A quick style profile it remembers ('no turtlenecks, ever'), plus weather-aware suggestions.
                  </p>
                </article>
              </div>
            </div>
          </section>
          <section id="how" className="cm-section cm-section-mist" aria-labelledby="how-title">
            <div className="cm-container" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "720px" }}>
                <p className="cm-eyebrow" style={{ margin: "0" }}>
                  Three steps
                </p>
                <h2 id="how-title" className="cm-h2" style={{ color: "var(--cm-ink)" }}>
                  How it works
                </h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)", gap: "64px", alignItems: "start" }}>
                <ol style={{ listStyle: "none", margin: "0", padding: "0", display: "flex", flexDirection: "column" }}>
                  {(v.howSteps || []).map((s, _i9) => (
                    <React.Fragment key={(s && s.key) || _i9}>
                      <li ref={s.ref} className={s.stepClass} style={{ minHeight: "440px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "16px" }}>
                        <span aria-hidden="true" style={{ width: "48px", height: "48px", borderRadius: "9999px", background: "var(--cm-aubergine)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "18px" }}>
                          {s.n}
                        </span>
                        <h3 className="cm-h3" style={{ color: "var(--cm-ink)" }}>
                          <button type="button" onClick={s.select} aria-current={s.ariaCurrent} style={{ background: "none", border: "0", padding: "0", font: "inherit", color: "inherit", textAlign: "left", cursor: "pointer" }}>
                            {s.title}
                          </button>
                        </h3>
                        <p className="cm-body" style={{ margin: "0", fontSize: "18px", color: "var(--cm-slate)", maxWidth: "460px" }}>
                          {s.text}
                        </p>
                      </li>
                    </React.Fragment>
                  ))}
                </ol>
                <div style={{ position: "sticky", top: "120px", paddingTop: "40px" }}>
                  {v.how0 && (
                    <>
                      <div className="cm-card cm-reveal" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
                        <p className="cm-caption" style={{ margin: "0", color: "var(--cm-slate)" }}>
                          Closet item capture · one piece per photo
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <figure style={{ margin: "0", display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                            {v.captureRaw ? (<img src={v.captureRaw} alt="Your photo: a green satin skirt laid out on a bedsheet" width="120" height="140" style={{ width: "120px", height: "140px", objectFit: "cover", borderRadius: "12px", display: "block" }} />) : (<div className="cm-item-tile" style={{ width: "120px", height: "140px" }}><svg viewBox="0 0 64 64" width="88" height="88" role="img" aria-label="Green satin skirt"><path d={v.ph.n1.d} fill={v.ph.n1.color} stroke={v.ph.n1.stroke} strokeWidth="1.5" strokeLinejoin="round" /><path d={v.ph.n1.d2} fill="none" stroke={v.ph.n1.stroke} strokeWidth="1.5" strokeLinecap="round" /></svg></div>)}
                            <figcaption className="cm-xsmall" style={{ color: "var(--cm-slate)" }}>
                              Your photo
                            </figcaption>
                          </figure>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "var(--cm-slate)", flex: "none" }}>
                            <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                          </svg>
                          <figure style={{ margin: "0", display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                            <div className="cm-item-tile" style={{ width: "120px", height: "140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {v.captureCut ? (<img src={v.captureCut} alt="The same skirt with the background removed" width="104" height="104" style={{ width: "104px", height: "104px", objectFit: "contain", display: "block" }} />) : (<svg viewBox="0 0 64 64" width="88" height="88" role="img" aria-label="Green satin skirt"><path d={v.ph.n1.d} fill={v.ph.n1.color} stroke={v.ph.n1.stroke} strokeWidth="1.5" strokeLinejoin="round" /><path d={v.ph.n1.d2} fill="none" stroke={v.ph.n1.stroke} strokeWidth="1.5" strokeLinecap="round" /></svg>)}
                            </div>
                            <figcaption className="cm-xsmall" style={{ color: "var(--cm-slate)" }}>
                              Background removed
                            </figcaption>
                          </figure>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "var(--cm-slate)", flex: "none" }}>
                            <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                          </svg>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: "1", minWidth: "0" }}>
                            <p className="cm-xsmall" style={{ margin: "0", color: "var(--cm-slate)" }}>
                              Details filled in. Tap to fix.
                            </p>
                            <span className="cm-understood" style={{ display: "inline-flex", alignItems: "center", gap: "6px", alignSelf: "flex-start" }}>
                              <b>
                                Category:
                              </b>
                              {" Skirt"}
                            </span>
                            <span className="cm-understood" style={{ display: "inline-flex", alignItems: "center", gap: "6px", alignSelf: "flex-start", outline: "2px solid var(--cm-success)", outlineOffset: "0" }}>
                              <b>
                                Color:
                              </b>
                              {" "}
                              <s>
                                Brown
                              </s>
                              {" Olive"}
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487z" />
                              </svg>
                            </span>
                            <span className="cm-understood" style={{ display: "inline-flex", alignItems: "center", gap: "6px", alignSelf: "flex-start" }}>
                              <b>
                                Formality:
                              </b>
                              {" Dressy"}
                            </span>
                            <span className="cm-understood" style={{ display: "inline-flex", alignItems: "center", gap: "6px", alignSelf: "flex-start" }}>
                              <b>
                                Season:
                              </b>
                              {" Spring, Fall"}
                            </span>
                            <p className="cm-xsmall" style={{ margin: "0", color: "var(--cm-success)", fontWeight: "600" }}>
                              Fixed by you
                            </p>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "20px", borderTop: "1px solid var(--cm-border)" }}>
                          <p className="cm-caption" style={{ margin: "0", color: "var(--cm-slate)" }}>
                            Or paste a store link
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "52px", padding: "0 16px", borderRadius: "16px", border: "1px solid var(--cm-border)", background: "var(--cm-bg)", color: "var(--cm-slate)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                            </svg>
                            <span className="cm-small" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              https://store.example.com/camel-blazer
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div className="cm-item-tile" style={{ width: "56px", height: "56px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {v.ph.n3.hasImg && (
                                <>
                                  <img src={v.ph.n3.img} alt="Camel blazer added from a store link" width="52" height="52" style={{ width: "52px", height: "52px", objectFit: "contain", display: "block" }} />
                                </>
                              )}
                              {v.ph.n3.noImg && (
                                <>
                                  <svg viewBox="0 0 64 64" width="44" height="44" role="img" aria-label="Camel blazer added from a store link">
                                    <path d={v.ph.n3.d} fill={v.ph.n3.color} stroke={v.ph.n3.stroke} strokeWidth="1.5" strokeLinejoin="round" />
                                    <path d={v.ph.n3.d2} fill="none" stroke={v.ph.n3.stroke} strokeWidth="1.5" strokeLinecap="round" />
                                  </svg>
                                </>
                              )}
                            </div>
                            <span className="cm-small" style={{ color: "var(--cm-ink)", fontWeight: "500" }}>
                              Blazer · Camel · Smart casual
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {v.how1 && (
                    <>
                      <div className="cm-card cm-reveal" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        <p className="cm-caption" style={{ margin: "0", color: "var(--cm-slate)" }}>
                          Your style profile
                        </p>
                        <div className="cm-card-flat" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                          <p className="cm-h6" style={{ margin: "0", color: "var(--cm-ink)" }}>
                            What fits do you like?
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            <span className="cm-small" style={{ padding: "8px 14px", borderRadius: "9999px", background: "var(--cm-aubergine)", color: "white" }}>
                              Relaxed at the waist
                            </span>
                            <span className="cm-small" style={{ padding: "8px 14px", borderRadius: "9999px", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                              Tailored
                            </span>
                            <span className="cm-small" style={{ padding: "8px 14px", borderRadius: "9999px", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                              Oversized
                            </span>
                          </div>
                        </div>
                        <div className="cm-card-flat" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                          <p className="cm-h6" style={{ margin: "0", color: "var(--cm-ink)" }}>
                            What are you going for?
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            <span className="cm-small" style={{ padding: "8px 14px", borderRadius: "9999px", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                              Polished
                            </span>
                            <span className="cm-small" style={{ padding: "8px 14px", borderRadius: "9999px", background: "var(--cm-aubergine)", color: "white" }}>
                              Effortless
                            </span>
                            <span className="cm-small" style={{ padding: "8px 14px", borderRadius: "9999px", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                              Bold
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
                          <div className="cm-card-flat" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <p className="cm-h6" style={{ margin: "0", color: "var(--cm-ink)" }}>
                              Your budget
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                              <span className="cm-small" style={{ padding: "8px 14px", borderRadius: "9999px", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                                Budget
                              </span>
                              <span className="cm-small" style={{ padding: "8px 14px", borderRadius: "9999px", background: "var(--cm-aubergine)", color: "white" }}>
                                Mid
                              </span>
                              <span className="cm-small" style={{ padding: "8px 14px", borderRadius: "9999px", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                                Premium
                              </span>
                            </div>
                          </div>
                          <div className="cm-card-flat" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <p className="cm-h6" style={{ margin: "0", color: "var(--cm-ink)" }}>
                              Your climate
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                              <span className="cm-small" style={{ padding: "8px 14px", borderRadius: "9999px", background: "var(--cm-aubergine)", color: "white" }}>
                                Hot
                              </span>
                              <span className="cm-small" style={{ padding: "8px 14px", borderRadius: "9999px", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                                Mild
                              </span>
                              <span className="cm-small" style={{ padding: "8px 14px", borderRadius: "9999px", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                                Cold
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {v.how2 && (
                    <>
                      <div className="cm-card cm-reveal" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }} aria-hidden="true">
                          <span className="cm-small" style={{ padding: "8px 14px", borderRadius: "9999px", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                            Outfit for today
                          </span>
                          <span className="cm-small" style={{ padding: "8px 14px", borderRadius: "9999px", background: "var(--cm-aubergine)", color: "white" }}>
                            Plan for an event
                          </span>
                          <span className="cm-small" style={{ padding: "8px 14px", borderRadius: "9999px", border: "1px solid var(--cm-border)", color: "var(--cm-ink)" }}>
                            Teach me something
                          </span>
                        </div>
                        <p className="cm-bubble-user cm-small" style={{ margin: "0", padding: "10px 14px", alignSelf: "flex-end", maxWidth: "80%" }}>
                          Cousin's wedding, cocktail attire, outdoors in October.
                        </p>
                        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <span className="cm-avatar-stylist" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 5.5a1.75 1.75 0 1 1 1.75 1.75c-.9.3-1.75.9-1.75 1.9v.6M12 9.75 3.5 16a1 1 0 0 0 .6 1.8h15.8a1 1 0 0 0 .6-1.8z" />
                            </svg>
                          </span>
                          <div className="cm-outfit" style={{ flex: "1", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {(v.heroOutfit2 || []).map((it, _i16) => (
                                  <React.Fragment key={(it && it.key) || _i16}>
                                    <div className="cm-item-tile" style={{ width: "56px", height: "56px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      {it.hasImg && (
                                        <>
                                          <img src={it.img} alt={it.alt} width="52" height="52" style={{ width: "52px", height: "52px", objectFit: "contain", display: "block" }} />
                                        </>
                                      )}
                                      {it.noImg && (
                                        <>
                                          <svg viewBox="0 0 64 64" width="44" height="44" role="img" aria-label={it.alt}>
                                            <path d={it.d} fill={it.color} stroke={it.stroke} strokeWidth="1.5" strokeLinejoin="round" />
                                            <path d={it.d2} fill="none" stroke={it.stroke} strokeWidth="1.5" strokeLinecap="round" />
                                          </svg>
                                        </>
                                      )}
                                    </div>
                                  </React.Fragment>
                                ))}
                              </div>
                              <span className="cm-heart cm-pop" aria-hidden="true" style={{ flex: "none" }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                </svg>
                              </span>
                            </div>
                            <p className="cm-h6" style={{ margin: "0", fontWeight: "600", color: "var(--cm-ink)" }}>
                              Vineyard wedding
                            </p>
                          </div>
                        </div>
                        <p className="cm-small" style={{ margin: "0", alignSelf: "center", display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "9999px", background: "var(--cm-success)", color: "white", fontWeight: "600" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 12.5 9.5 17 19 7" />
                          </svg>
                          Saved to your Lookbook
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
          <section id="calculator" className="cm-section" aria-labelledby="calc-title">
            <div className="cm-container">
              <div className="cm-card-flat" style={{ padding: "56px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "56px", alignItems: "center", background: "var(--cm-mist)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <p className="cm-eyebrow" style={{ margin: "0" }}>
                      Closet potential
                    </p>
                    <h2 id="calc-title" className="cm-h2" style={{ color: "var(--cm-ink)" }}>
                      See what's already in your closet.
                    </h2>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {(v.calc || []).map((r, _i10) => (
                      <React.Fragment key={(r && r.key) || _i10}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "8px 0", borderBottom: "1px solid var(--cm-border)" }}>
                          <label htmlFor={r.id} className="cm-body" style={{ color: "var(--cm-ink)", fontWeight: "500" }}>
                            {r.label}
                          </label>
                          <div className="cm-stepper" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button type="button" className="cm-stepper-btn" onClick={r.dec} aria-label={r.decLabel}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                <path d="M5 12h14" />
                              </svg>
                            </button>
                            <input type="number" id={r.id} className="cm-stepper-input" min="0" max="200" value={r.value} onChange={r.onInput} />
                            <button type="button" className="cm-stepper-btn" onClick={r.inc} aria-label={r.incLabel}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                <path d="M12 5v14M5 12h14" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div className="cm-card" style={{ padding: "48px 32px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "12px" }} aria-live="polite">
                  <p className="cm-caption" style={{ margin: "0", color: "var(--cm-slate)" }}>
                    Possible outfit combinations in your closet
                  </p>
                  <p style={{ margin: "0", fontFamily: "Inter, sans-serif", fontSize: "112px", fontWeight: "300", lineHeight: "1", letterSpacing: "-0.02em", color: "var(--cm-accent)" }}>
                    {v.calcResult}
                  </p>
                  <p className="cm-body" style={{ margin: "0", color: "var(--cm-ink)" }}>
                    Not every combination works. That's what your stylist is for.
                  </p>
                  <p className="cm-xsmall" style={{ margin: "0", color: "var(--cm-slate)" }}>
                    {v.calcFormula}
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section id="stories" className="cm-section" aria-labelledby="stories-title" style={{ background: "var(--cm-highlight)" }}>
            <div className="cm-container" style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
              <h2 id="stories-title" className="cm-h2" style={{ textAlign: "center", maxWidth: "760px", margin: "0 auto", color: "var(--cm-ink)" }}>
                The 'aha' moment, every time you get dressed.
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "24px" }}>
                {(v.testimonials || []).map((t, _i8) => (
                  <React.Fragment key={(t && t.key) || _i8}>
                    <figure className="cm-card cm-reveal" style={{ margin: "0", position: "relative", padding: "40px 32px 32px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "28px" }}>
                      <span className="cm-badge" style={{ position: "absolute", top: "20px", right: "20px" }}>
                        Example
                      </span>
                      <blockquote className="cm-h6" style={{ margin: "0", paddingTop: "12px", color: "var(--cm-ink)", fontWeight: "400", lineHeight: "1.55" }}>
                        “{t.quote}”
                      </blockquote>
                      <figcaption style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span aria-hidden="true" style={css(`width: 44px; height: 44px; border-radius: 9999px; background: ${t.tint}; color: var(--cm-on-linen); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 15px`)}>
                          {t.initials}
                        </span>
                        <span className="cm-small" style={{ color: "var(--cm-slate)" }}>
                          {t.name}
                        </span>
                      </figcaption>
                    </figure>
                  </React.Fragment>
                ))}
              </div>
              <ul style={{ listStyle: "none", margin: "0", padding: "0", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "32px" }}>
                <li className="cm-small" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--cm-ink)", fontWeight: "500" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "var(--cm-icon)" }}>
                    <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                  </svg>
                  Photos private, never sold
                </li>
                <li className="cm-small" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--cm-ink)", fontWeight: "500" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "var(--cm-icon)" }}>
                    <path d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  No ads
                </li>
                <li className="cm-small" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--cm-ink)", fontWeight: "500" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "var(--cm-icon)" }}>
                    <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  </svg>
                  Cancel anytime
                </li>
              </ul>
            </div>
          </section>
          <section className="cm-gradient-band" aria-labelledby="band-title" style={{ padding: "96px 0" }}>
            <div className="cm-container" style={{ display: "flex", flexDirection: "column", gap: "24px", alignItems: "flex-start" }}>
              <h2 id="band-title" className="cm-h2" style={{ color: "white", maxWidth: "600px" }}>
                Your next great outfit is already in your closet. Let's talk it through.
              </h2>
              <button type="button" className="cm-btn cm-btn-white cm-btn-lg" onClick={v.openTrial}>
                Start your free trial
              </button>
              <p className="cm-caption" style={{ margin: "0", color: "white" }}>
                14 days of full access · No credit card
              </p>
            </div>
          </section>
          <section id="coming-soon" className="cm-section" aria-labelledby="coming-title">
            <div className="cm-container" style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <p className="cm-eyebrow" style={{ margin: "0" }}>
                    On the roadmap
                  </p>
                  <h2 id="coming-title" className="cm-h2" style={{ color: "var(--cm-ink)" }}>
                    Coming soon
                  </h2>
                </div>
                <p className="cm-body" style={{ margin: "0", color: "var(--cm-slate)" }}>
                  Plus members get these as they launch.
                </p>
              </div>
              <ul style={{ listStyle: "none", margin: "0", padding: "0", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "24px" }}>
                <li className="cm-coming" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316z" />
                      <path d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0z" />
                    </svg>
                    <span className="cm-badge">
                      Coming soon
                    </span>
                  </div>
                  <h3 className="cm-h5" style={{ color: "inherit", fontWeight: "600" }}>
                    Rate my outfit
                  </h3>
                  <p className="cm-small" style={{ margin: "0", color: "inherit" }}>
                    Snap a mirror photo, get feedback and swaps from your closet.
                  </p>
                </li>
                <li className="cm-coming" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M7 11v9H4v-9h3zM7 11l4-7a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 17.3 20H7" />
                    </svg>
                    <span className="cm-badge">
                      Coming soon
                    </span>
                  </div>
                  <h3 className="cm-h5" style={{ color: "inherit", fontWeight: "600" }}>
                    Wear log & reactions
                  </h3>
                  <p className="cm-small" style={{ margin: "0", color: "inherit" }}>
                    Thumbs up or down, so your stylist learns your taste.
                  </p>
                </li>
                <li className="cm-coming" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25zM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6zM17 14v6M14 17h6" />
                    </svg>
                    <span className="cm-badge">
                      Coming soon
                    </span>
                  </div>
                  <h3 className="cm-h5" style={{ color: "inherit", fontWeight: "600" }}>
                    Complete the look
                  </h3>
                  <p className="cm-small" style={{ margin: "0", color: "inherit" }}>
                    When an outfit is missing one piece, see options at budget, mid and premium prices.
                  </p>
                </li>
                <li className="cm-coming" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                    <span className="cm-badge">
                      Coming soon
                    </span>
                  </div>
                  <h3 className="cm-h5" style={{ color: "inherit", fontWeight: "600" }}>
                    Weekly planner, packing lists & closet insights
                  </h3>
                </li>
                <li className="cm-coming" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09zM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456z" />
                    </svg>
                    <span className="cm-badge">
                      Coming soon
                    </span>
                  </div>
                  <h3 className="cm-h5" style={{ color: "inherit", fontWeight: "600" }}>
                    Hair and makeup styling
                  </h3>
                  <p className="cm-small" style={{ margin: "0", color: "inherit" }}>
                    (later)
                  </p>
                </li>
              </ul>
            </div>
          </section>
          <section id="pricing" className="cm-section cm-section-mist" aria-labelledby="pricing-title">
            <div className="cm-container" style={{ display: "flex", flexDirection: "column", gap: "40px", alignItems: "center" }}>
              <h2 id="pricing-title" className="cm-h2" style={{ textAlign: "center", color: "var(--cm-ink)" }}>
                Start with everything. Decide later.
              </h2>
              <p className="cm-body" style={{ margin: "0", maxWidth: "760px", textAlign: "center", padding: "20px 28px", borderRadius: "16px", background: "var(--cm-highlight)", color: "var(--cm-ink)" }}>
                {"Every new account gets "}
                <strong>
                  14 days of full access to Plus
                </strong>
                . No credit card. When the trial ends, you can upgrade or keep using the Free plan.
              </p>
              <div className="cm-toggle" role="group" aria-label="Billing period">
                <button type="button" className="cm-toggle-btn" aria-pressed={v.monthlyPressed} onClick={v.setMonthly}>
                  Monthly
                </button>
                <button type="button" className="cm-toggle-btn" aria-pressed={v.annualPressed} onClick={v.setAnnual}>
                  Annual · save 34%
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "32px", width: "100%", maxWidth: "920px", alignItems: "stretch" }}>
                <article className="cm-card" style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <h3 className="cm-h4" style={{ color: "var(--cm-ink)" }}>
                      Free
                    </h3>
                    <p style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "8px", color: "var(--cm-ink)" }}>
                      <span style={{ fontSize: "48px", fontWeight: "700", lineHeight: "1" }}>
                        $0
                      </span>
                      <span className="cm-small" style={{ color: "var(--cm-slate)" }}>
                        after your trial
                      </span>
                    </p>
                  </div>
                  <ul style={{ listStyle: "none", margin: "0", padding: "0", display: "flex", flexDirection: "column", gap: "14px", flex: "1" }}>
                    <li className="cm-body" style={{ display: "flex", gap: "10px", color: "var(--cm-ink)" }}>
                      <svg className="cm-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                        <path d="M5 12.5 9.5 17 19 7" />
                      </svg>
                      <span>
                        {"Up to "}
                        <strong>
                          40 closet items
                        </strong>
                        {" (anything over 40 is locked, never deleted)"}
                      </span>
                    </li>
                    <li className="cm-body" style={{ display: "flex", gap: "10px", color: "var(--cm-ink)" }}>
                      <svg className="cm-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                        <path d="M5 12.5 9.5 17 19 7" />
                      </svg>
                      <span>
                        <strong>
                          About 50 stylist messages a month
                        </strong>
                      </span>
                    </li>
                  </ul>
                  <button type="button" className="cm-btn-secondary cm-btn-block" onClick={v.openTrial} style={{ height: "48px", fontWeight: "600" }}>
                    Start your free trial
                  </button>
                </article>
                <article className="cm-card" style={{ position: "relative", padding: "40px", display: "flex", flexDirection: "column", gap: "24px", border: "2px solid var(--cm-aubergine)", transform: "scale(1.03)" }}>
                  <span className="cm-badge-hot" style={{ position: "absolute", top: "-14px", left: "40px" }}>
                    Best for most people
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <h3 className="cm-h4" style={{ color: "var(--cm-ink)" }}>
                      ClosetMuse Plus
                    </h3>
                    <p style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "6px", color: "var(--cm-ink)" }}>
                      <span style={{ fontSize: "48px", fontWeight: "700", lineHeight: "1" }}>
                        {v.plusPrice}
                      </span>
                      <span className="cm-body" style={{ color: "var(--cm-slate)" }}>
                        {v.plusPer}
                      </span>
                    </p>
                    <p className="cm-small" style={{ margin: "0", color: "var(--cm-slate)" }}>
                      {v.plusNote}
                    </p>
                  </div>
                  <ul style={{ listStyle: "none", margin: "0", padding: "0", display: "flex", flexDirection: "column", gap: "14px", flex: "1" }}>
                    <li className="cm-body" style={{ display: "flex", gap: "10px", color: "var(--cm-ink)" }}>
                      <svg className="cm-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                        <path d="M5 12.5 9.5 17 19 7" />
                      </svg>
                      <span>
                        Unlimited closet
                      </span>
                    </li>
                    <li className="cm-body" style={{ display: "flex", gap: "10px", color: "var(--cm-ink)" }}>
                      <svg className="cm-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                        <path d="M5 12.5 9.5 17 19 7" />
                      </svg>
                      <span>
                        Unlimited stylist chat (fair use)
                      </span>
                    </li>
                    <li className="cm-body" style={{ display: "flex", gap: "10px", color: "var(--cm-ink)" }}>
                      <svg className="cm-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                        <path d="M5 12.5 9.5 17 19 7" />
                      </svg>
                      <span>
                        Lookbook
                      </span>
                    </li>
                    <li className="cm-body" style={{ display: "flex", gap: "10px", color: "var(--cm-ink)" }}>
                      <svg className="cm-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                        <path d="M5 12.5 9.5 17 19 7" />
                      </svg>
                      <span>
                        Event planning
                      </span>
                    </li>
                    <li className="cm-body" style={{ display: "flex", gap: "10px", color: "var(--cm-ink)" }}>
                      <svg className="cm-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: "3px" }}>
                        <path d="M5 12.5 9.5 17 19 7" />
                      </svg>
                      <span>
                        Plus coming-soon features as they launch
                      </span>
                    </li>
                  </ul>
                  <button type="button" className="cm-btn cm-btn-block" onClick={v.openTrial}>
                    Start your free trial
                  </button>
                </article>
              </div>
              <p className="cm-caption" style={{ margin: "0", color: "var(--cm-slate)" }}>
                Cancel anytime. Prices in USD.
              </p>
            </div>
          </section>
          <section id="privacy" className="cm-section" aria-labelledby="privacy-title">
            <div className="cm-container" style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1.2fr)", gap: "64px", alignItems: "center" }}>
              <h2 id="privacy-title" className="cm-h3" style={{ color: "var(--cm-ink)" }}>
                Your closet is personal. We treat it that way.
              </h2>
              <ul style={{ listStyle: "none", margin: "0", padding: "0", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "24px" }}>
                <li style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <span className="cm-icon-circle" aria-hidden="true" style={{ flex: "none" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                    </svg>
                  </span>
                  <p className="cm-body" style={{ margin: "0", paddingTop: "12px", color: "var(--cm-ink)" }}>
                    Your photos are private and never sold.
                  </p>
                </li>
                <li style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <span className="cm-icon-circle" aria-hidden="true" style={{ flex: "none" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </span>
                  <p className="cm-body" style={{ margin: "0", paddingTop: "12px", color: "var(--cm-ink)" }}>
                    Delete your closet and all your data anytime.
                  </p>
                </li>
                <li style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <span className="cm-icon-circle" aria-hidden="true" style={{ flex: "none" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </span>
                  <p className="cm-body" style={{ margin: "0", paddingTop: "12px", color: "var(--cm-ink)" }}>
                    No ads.
                  </p>
                </li>
                <li style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <span className="cm-icon-circle" aria-hidden="true" style={{ flex: "none" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                    </svg>
                  </span>
                  <p className="cm-body" style={{ margin: "0", paddingTop: "12px", color: "var(--cm-ink)" }}>
                    Shopping suggestions are optional. They only appear when a piece would complete an outfit, and they're clearly labeled when a link may earn us a commission.
                  </p>
                </li>
              </ul>
            </div>
          </section>
          <section id="faq" className="cm-section cm-section-mist" aria-labelledby="faq-title">
            <div className="cm-container" style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
              <h2 id="faq-title" className="cm-h2" style={{ textAlign: "center", color: "var(--cm-ink)" }}>
                Questions, answered
              </h2>
              <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", borderTop: "1px solid var(--cm-border)" }}>
                {(v.faqs || []).map((f, _i8) => (
                  <React.Fragment key={(f && f.key) || _i8}>
                    <div style={{ borderBottom: "1px solid var(--cm-border)" }}>
                      <h3 className="cm-h6" style={{ margin: "0", color: "var(--cm-ink)" }}>
                        <button type="button" className="cm-acc-btn" id={f.btnId} aria-expanded={f.ariaExpanded} aria-controls={f.panelId} onClick={f.toggle}>
                          <span>
                            {f.q}
                          </span>
                          <svg className={f.iconClass} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                      </h3>
                      {f.open && (
                        <>
                          <div id={f.panelId} role="region" aria-labelledby={f.btnId} style={{ padding: "0 40px 24px 0" }}>
                            <p className="cm-body" style={{ margin: "0", color: "var(--cm-slate)" }}>
                              {f.a}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </section>
          <section id="final" className="cm-section" aria-labelledby="final-title" style={{ position: "relative", overflow: "hidden", padding: "140px 0" }}>
            <div className="cm-orb" aria-hidden="true" style={{ width: "640px", height: "640px", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }} />
            <div className="cm-container" style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "24px" }}>
              <h2 id="final-title" className="cm-h1" style={{ color: "var(--cm-ink)" }}>
                Stop guessing. Start asking.
              </h2>
              <p className="cm-h6" style={{ margin: "0", maxWidth: "620px", fontWeight: "400", lineHeight: "1.6", color: "var(--cm-ink)" }}>
                A stylist who knows your closet, explains every outfit, and makes you more confident every time you get dressed.
              </p>
              <button type="button" className="cm-btn cm-btn-lg" onClick={v.openTrial}>
                Start your free trial
              </button>
              <p className="cm-caption" style={{ margin: "0", color: "var(--cm-ink)" }}>
                14 days of full access · No credit card · iPhone & Android
              </p>
            </div>
          </section>
        </main>
        <footer className="cm-footer" style={{ padding: "80px 0 40px" }}>
          <div className="cm-container" style={{ display: "flex", flexDirection: "column", gap: "56px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.8fr) repeat(3, minmax(0, 1fr))", gap: "48px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <a href="#top" aria-label="ClosetMuse home" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "inherit" }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
                    <path d="M7 3h18a5 5 0 0 1 5 5v11a5 5 0 0 1-5 5H15l-7 5v-5H7a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5z" fill="#A85C7A" />
                    <path d="M16 9.2a1.7 1.7 0 1 1 1.7 1.7c-.8.3-1.7.8-1.7 1.8v.6M16 13.3l-7.2 4.6h14.4z" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="cm-serif" style={{ fontSize: "24px", lineHeight: "1" }}>
                    ClosetMuse
                  </span>
                </a>
                <p className="cm-body" style={{ margin: "0" }}>
                  Your closet, explained.
                </p>
                <form onSubmit={v.submitNewsletter} style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "420px" }}>
                  <label htmlFor="cm-news-email" className="cm-caption">
                    Get one style lesson a week
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input type="email" id="cm-news-email" className="cm-input" placeholder="you@example.com" autoComplete="email" value={v.newsletterEmail} onChange={v.onNewsletter} style={{ flex: "1", minWidth: "0" }} />
                    <button type="submit" className="cm-btn" style={{ flex: "none" }}>
                      Subscribe
                    </button>
                  </div>
                  {v.hasNewsletterMsg && (
                    <>
                      <p className="cm-small" role="status" style={{ margin: "0" }}>
                        {v.newsletterMsg}
                      </p>
                    </>
                  )}
                </form>
                <div style={{ display: "flex", gap: "8px" }}>
                  <a href="#" className="cm-icon-btn" aria-label="ClosetMuse on Instagram" style={{ color: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <path d="M17.5 6.5h.01" />
                    </svg>
                  </a>
                  <a href="#" className="cm-icon-btn" aria-label="ClosetMuse on TikTok" style={{ color: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.5 2.5 4.5 5 4.5" />
                    </svg>
                  </a>
                  <a href="#" className="cm-icon-btn" aria-label="ClosetMuse on Pinterest" style={{ color: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M10.5 8.6c1.9-.7 4.3.3 4.3 2.5 0 2.1-1.6 3.6-3.2 3.2M11.6 10.2l-2.1 8.8" />
                    </svg>
                  </a>
                </div>
              </div>
              <nav aria-label="Product" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <h2 className="cm-caption" style={{ margin: "0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Product
                </h2>
                <a href="#stylist">
                  Try the stylist
                </a>
                <a href="#how">
                  How it works
                </a>
                <a href="#features">
                  Features
                </a>
                <a href="#pricing">
                  Pricing
                </a>
                <a href="#faq">
                  FAQ
                </a>
                <a href="/word2vec/">
                  Word2Vec lab
                </a>
              </nav>
              <nav aria-label="Company" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <h2 className="cm-caption" style={{ margin: "0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Company
                </h2>
                <a href="#">
                  About
                </a>
                <a href="#">
                  Contact
                </a>
              </nav>
              <nav aria-label="Legal" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <h2 className="cm-caption" style={{ margin: "0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Legal
                </h2>
                <a href="#">
                  Privacy policy
                </a>
                <a href="#">
                  Terms of service
                </a>
                <a href="#">
                  Affiliate disclosure
                </a>
              </nav>
            </div>
            <p className="cm-small" style={{ margin: "0", paddingTop: "24px", borderTop: "1px solid rgba(246, 227, 198, 0.2)" }}>
              {"© 2026 ClosetMuse"}
            </p>
          </div>
        </footer>
        {v.modalOpen && (
          <>
            <div className="cm-modal-backdrop" onClick={v.closeTrial} />
            <div className="cm-modal" role="dialog" aria-modal="true" aria-labelledby="cm-trial-title" style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "40px", textAlign: "center" }}>
              <button type="button" className="cm-icon-btn" aria-label="Close" onClick={v.closeTrial} style={{ position: "absolute", top: "12px", right: "12px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
              <svg width="48" height="48" viewBox="0 0 32 32" aria-hidden="true" style={{ alignSelf: "center" }}>
                <path d="M7 3h18a5 5 0 0 1 5 5v11a5 5 0 0 1-5 5H15l-7 5v-5H7a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5z" fill="#5B3A70" />
                <path d="M16 9.2a1.7 1.7 0 1 1 1.7 1.7c-.8.3-1.7.8-1.7 1.8v.6M16 13.3l-7.2 4.6h14.4z" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h2 id="cm-trial-title" className="cm-h2" style={{ color: "var(--cm-ink)", fontSize: "32px" }}>
                Get ClosetMuse on your phone
              </h2>
              <p className="cm-caption" style={{ margin: "0", color: "var(--cm-slate)" }}>
                14 days of full access · No credit card · iPhone & Android
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <a href="#" className="cm-store-badge" aria-label="Download on the App Store" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                  <span style={{ display: "flex", flexDirection: "column", textAlign: "left", lineHeight: "1.15" }}>
                    <span style={{ fontSize: "11px" }}>
                      Download on the
                    </span>
                    <span style={{ fontSize: "18px", fontWeight: "600" }}>
                      App Store
                    </span>
                  </span>
                </a>
                <a href="#" className="cm-store-badge" aria-label="Get it on Google Play" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 0 1 0 1.971l-11.54 6.347a1.125 1.125 0 0 1-1.667-.985V5.653z" />
                  </svg>
                  <span style={{ display: "flex", flexDirection: "column", textAlign: "left", lineHeight: "1.15" }}>
                    <span style={{ fontSize: "11px" }}>
                      Get it on
                    </span>
                    <span style={{ fontSize: "18px", fontWeight: "600" }}>
                      Google Play
                    </span>
                  </span>
                </a>
              </div>
              <p className="cm-xsmall" style={{ margin: "0", color: "var(--cm-slate)" }}>
                Store links are placeholders until the listings are live.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--cm-slate)" }} aria-hidden="true">
                <span style={{ flex: "1", height: "1px", background: "var(--cm-border)" }} />
                <span className="cm-xsmall">
                  or
                </span>
                <span style={{ flex: "1", height: "1px", background: "var(--cm-border)" }} />
              </div>
              {v.trialSent && (
                <>
                  <p className="cm-body" role="status" style={{ margin: "0", color: "var(--cm-success)", fontWeight: "600" }}>
                    Sent. Check your inbox for the download link.
                  </p>
                </>
              )}
              <form onSubmit={v.submitTrialEmail} style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "left" }}>
                <label htmlFor="cm-trial-email" className="cm-caption" style={{ color: "var(--cm-ink)" }}>
                  Email me the download link
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="email" id="cm-trial-email" className="cm-input" placeholder="you@example.com" autoComplete="email" value={v.trialEmail} onChange={v.onTrialEmail} aria-describedby="cm-trial-err" style={{ flex: "1", minWidth: "0" }} />
                  <button type="submit" className="cm-btn" style={{ flex: "none" }}>
                    Send link
                  </button>
                </div>
                {v.hasTrialError && (
                  <>
                    <p id="cm-trial-err" className="cm-small" role="alert" style={{ margin: "0", color: "var(--cm-error)" }}>
                      {v.trialError}
                    </p>
                  </>
                )}
              </form>
            </div>
          </>
        )}
        <div className={v.toastClass} role="status" aria-live="polite">
          {v.toastMsg}
        </div>
      </div>
    );
  }
}
