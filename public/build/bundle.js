
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\App.svelte generated by Svelte v3.49.0 */

    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let input;
    	let t0;
    	let h1;
    	let t1;
    	let t2;
    	let t3;
    	let div0;
    	let img;
    	let img_src_value;
    	let t4;
    	let form0;
    	let h40;
    	let t6;
    	let t7_value = Math.round(/*count*/ ctx[1]) + "";
    	let t7;
    	let t8;
    	let div3;
    	let div1;
    	let form1;
    	let h41;
    	let t10;
    	let t11_value = Math.round(/*price*/ ctx[2]) + "";
    	let t11;
    	let t12;
    	let button0;
    	let t14;
    	let div2;
    	let form2;
    	let h42;
    	let t16;
    	let t17_value = Math.round(/*autoclickerprice*/ ctx[3]) + "";
    	let t17;
    	let t18;
    	let button1;
    	let t20;
    	let div5;
    	let p;
    	let t21;
    	let br0;
    	let t22;
    	let br1;
    	let t23;
    	let br2;
    	let t24;
    	let t25;
    	let div4;
    	let t27;
    	let h43;
    	let t28;
    	let a0;
    	let br3;
    	let t30;
    	let a1;
    	let br4;
    	let t32;
    	let a2;
    	let br5;
    	let t34;
    	let h44;
    	let t35;
    	let br6;
    	let t36;
    	let br7;
    	let t37;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			input = element("input");
    			t0 = space();
    			h1 = element("h1");
    			t1 = text("Hello ");
    			t2 = text(/*name*/ ctx[0]);
    			t3 = space();
    			div0 = element("div");
    			img = element("img");
    			t4 = space();
    			form0 = element("form");
    			h40 = element("h4");
    			h40.textContent = "Clicks:";
    			t6 = space();
    			t7 = text(t7_value);
    			t8 = space();
    			div3 = element("div");
    			div1 = element("div");
    			form1 = element("form");
    			h41 = element("h4");
    			h41.textContent = "Clicker upgrade price:";
    			t10 = space();
    			t11 = text(t11_value);
    			t12 = space();
    			button0 = element("button");
    			button0.textContent = "Upgrade";
    			t14 = space();
    			div2 = element("div");
    			form2 = element("form");
    			h42 = element("h4");
    			h42.textContent = "AClick upgrade price:";
    			t16 = space();
    			t17 = text(t17_value);
    			t18 = space();
    			button1 = element("button");
    			button1.textContent = "Upgrade";
    			t20 = space();
    			div5 = element("div");
    			p = element("p");
    			t21 = text("Hello lad! if you need any help I'm here for you to explain what\n      everything does!");
    			br0 = element("br");
    			t22 = text("\n      - The text field above Hello world is purely cosmetic, you can type your name\n      in it and it will display it instead of \"World\" ");
    			br1 = element("br");
    			t23 = text("\n      - The Svelte Logo or \"S\" is used to click on so you get more clicks and also\n      there is an auto clicker that clicks for you every second\n      ");
    			br2 = element("br");
    			t24 = text("\n      - There are two upgrade buttons wich grant you +1 click to either the normal\n      clicks or the autoclicker but the price changes exponenitally");
    			t25 = space();
    			div4 = element("div");
    			div4.textContent = "X";
    			t27 = space();
    			h43 = element("h4");
    			t28 = text("Visit my ");
    			a0 = element("a");
    			a0.textContent = "Site";
    			br3 = element("br");
    			t30 = text("\n    My ");
    			a1 = element("a");
    			a1.textContent = "GitHub";
    			br4 = element("br");
    			t32 = text("\n    My ");
    			a2 = element("a");
    			a2.textContent = "Twitch";
    			br5 = element("br");
    			t34 = space();
    			h44 = element("h4");
    			t35 = text("Any further questions?");
    			br6 = element("br");
    			t36 = text("Add me on discord ");
    			br7 = element("br");
    			t37 = text("McJiggy's security\n    checkpoint#4500");
    			attr_dev(input, "class", "nameInput svelte-1ckp45s");
    			add_location(input, file, 43, 2, 721);
    			attr_dev(h1, "class", "svelte-1ckp45s");
    			add_location(h1, file, 44, 2, 769);
    			if (!src_url_equal(img.src, img_src_value = "images/SvelteLogo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Svelte");
    			attr_dev(img, "class", "svelte-logo svelte-1ckp45s");
    			add_location(img, file, 47, 4, 804);
    			attr_dev(h40, "class", "svelte-1ckp45s");
    			add_location(h40, file, 54, 6, 933);
    			attr_dev(form0, "class", "svelte-1ckp45s");
    			add_location(form0, file, 53, 4, 920);
    			attr_dev(div0, "class", "svelte-1ckp45s");
    			add_location(div0, file, 46, 2, 794);
    			attr_dev(h41, "class", "svelte-1ckp45s");
    			add_location(h41, file, 64, 8, 1148);
    			attr_dev(form1, "class", "svelte-1ckp45s");
    			add_location(form1, file, 63, 6, 1133);
    			set_style(button0, "margin-top", "1em");
    			attr_dev(button0, "class", "learn-more svelte-1ckp45s");
    			add_location(button0, file, 67, 6, 1228);
    			set_style(div1, "display", "inline-block");
    			set_style(div1, "vertical-align", "top");
    			set_style(div1, "padding-right", "15px");
    			attr_dev(div1, "class", "svelte-1ckp45s");
    			add_location(div1, file, 60, 4, 1038);
    			attr_dev(h42, "class", "svelte-1ckp45s");
    			add_location(h42, file, 75, 8, 1455);
    			attr_dev(form2, "class", "svelte-1ckp45s");
    			add_location(form2, file, 74, 6, 1440);
    			set_style(button1, "margin-top", "1em");
    			attr_dev(button1, "class", "learn-more svelte-1ckp45s");
    			add_location(button1, file, 78, 6, 1545);
    			set_style(div2, "display", "inline-block");
    			set_style(div2, "vertical-align", "top");
    			set_style(div2, "padding-left", "15px");
    			attr_dev(div2, "class", "svelte-1ckp45s");
    			add_location(div2, file, 71, 4, 1345);
    			set_style(div3, "text-align", "center");
    			attr_dev(div3, "class", "svelte-1ckp45s");
    			add_location(div3, file, 59, 2, 1000);
    			attr_dev(br0, "class", "svelte-1ckp45s");
    			add_location(br0, file, 88, 22, 1857);
    			attr_dev(br1, "class", "svelte-1ckp45s");
    			add_location(br1, file, 90, 54, 2002);
    			attr_dev(br2, "class", "svelte-1ckp45s");
    			add_location(br2, file, 93, 6, 2162);
    			attr_dev(p, "class", "svelte-1ckp45s");
    			add_location(p, file, 86, 4, 1760);
    			set_style(div4, "position", "absolute");
    			set_style(div4, "top", "10px");
    			set_style(div4, "right", "10px");
    			set_style(div4, "background-color", "#04444E");
    			set_style(div4, "padding", "10px");
    			set_style(div4, "padding-left", "15px");
    			set_style(div4, "padding-right", "15px");
    			set_style(div4, "color", "#FFDBDD");
    			set_style(div4, "cursor", "pointer");
    			attr_dev(div4, "onclick", "this.parentElement.style.display='none'");
    			attr_dev(div4, "class", "svelte-1ckp45s");
    			add_location(div4, file, 97, 4, 2333);
    			attr_dev(div5, "class", "info svelte-1ckp45s");
    			add_location(div5, file, 84, 2, 1675);
    			attr_dev(a0, "href", "https://foss-for-us.web.app/");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "class", "svelte-1ckp45s");
    			add_location(a0, file, 106, 13, 2672);
    			attr_dev(br3, "class", "svelte-1ckp45s");
    			add_location(br3, file, 106, 76, 2735);
    			attr_dev(a1, "href", "https://github.com/Igo-Cigo");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "svelte-1ckp45s");
    			add_location(a1, file, 108, 7, 2753);
    			attr_dev(br4, "class", "svelte-1ckp45s");
    			add_location(br4, file, 108, 71, 2817);
    			attr_dev(a2, "href", "https://www.twitch.tv/igocigo");
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "class", "svelte-1ckp45s");
    			add_location(a2, file, 109, 7, 2831);
    			attr_dev(br5, "class", "svelte-1ckp45s");
    			add_location(br5, file, 109, 73, 2897);
    			set_style(h43, "position", "absolute");
    			set_style(h43, "top", "1px");
    			set_style(h43, "right", "30px");
    			attr_dev(h43, "class", "svelte-1ckp45s");
    			add_location(h43, file, 105, 2, 2604);
    			attr_dev(br6, "class", "svelte-1ckp45s");
    			add_location(br6, file, 113, 26, 2995);
    			attr_dev(br7, "class", "svelte-1ckp45s");
    			add_location(br7, file, 113, 50, 3019);
    			set_style(h44, "position", "absolute");
    			set_style(h44, "top", "1px");
    			set_style(h44, "left", "30px");
    			attr_dev(h44, "class", "svelte-1ckp45s");
    			add_location(h44, file, 112, 2, 2915);
    			attr_dev(main, "class", "svelte-1ckp45s");
    			add_location(main, file, 42, 0, 712);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, input);
    			set_input_value(input, /*name*/ ctx[0]);
    			append_dev(main, t0);
    			append_dev(main, h1);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(main, t3);
    			append_dev(main, div0);
    			append_dev(div0, img);
    			append_dev(div0, t4);
    			append_dev(div0, form0);
    			append_dev(form0, h40);
    			append_dev(form0, t6);
    			append_dev(form0, t7);
    			append_dev(main, t8);
    			append_dev(main, div3);
    			append_dev(div3, div1);
    			append_dev(div1, form1);
    			append_dev(form1, h41);
    			append_dev(form1, t10);
    			append_dev(form1, t11);
    			append_dev(div1, t12);
    			append_dev(div1, button0);
    			append_dev(div3, t14);
    			append_dev(div3, div2);
    			append_dev(div2, form2);
    			append_dev(form2, h42);
    			append_dev(form2, t16);
    			append_dev(form2, t17);
    			append_dev(div2, t18);
    			append_dev(div2, button1);
    			append_dev(main, t20);
    			append_dev(main, div5);
    			append_dev(div5, p);
    			append_dev(p, t21);
    			append_dev(p, br0);
    			append_dev(p, t22);
    			append_dev(p, br1);
    			append_dev(p, t23);
    			append_dev(p, br2);
    			append_dev(p, t24);
    			append_dev(div5, t25);
    			append_dev(div5, div4);
    			append_dev(main, t27);
    			append_dev(main, h43);
    			append_dev(h43, t28);
    			append_dev(h43, a0);
    			append_dev(h43, br3);
    			append_dev(h43, t30);
    			append_dev(h43, a1);
    			append_dev(h43, br4);
    			append_dev(h43, t32);
    			append_dev(h43, a2);
    			append_dev(h43, br5);
    			append_dev(main, t34);
    			append_dev(main, h44);
    			append_dev(h44, t35);
    			append_dev(h44, br6);
    			append_dev(h44, t36);
    			append_dev(h44, br7);
    			append_dev(h44, t37);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(img, "click", /*cps*/ ctx[4], false, false, false),
    					listen_dev(button0, "click", /*oneup*/ ctx[5], false, false, false),
    					listen_dev(button1, "click", /*auto_oneup*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1 && input.value !== /*name*/ ctx[0]) {
    				set_input_value(input, /*name*/ ctx[0]);
    			}

    			if (dirty & /*name*/ 1) set_data_dev(t2, /*name*/ ctx[0]);
    			if (dirty & /*count*/ 2 && t7_value !== (t7_value = Math.round(/*count*/ ctx[1]) + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*price*/ 4 && t11_value !== (t11_value = Math.round(/*price*/ ctx[2]) + "")) set_data_dev(t11, t11_value);
    			if (dirty & /*autoclickerprice*/ 8 && t17_value !== (t17_value = Math.round(/*autoclickerprice*/ ctx[3]) + "")) set_data_dev(t17, t17_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let name = "world";
    	let count = 1;
    	let upgrade = 0;
    	let price = 10;
    	let exponent = 2.718282;
    	let autoclickerprice = 10;
    	let autocps = 1;

    	function cps() {
    		$$invalidate(1, count += 1 + upgrade);
    	}

    	function oneup() {
    		if (count >= price) {
    			upgrade += 1;
    			$$invalidate(1, count -= price);
    			increaseprice();
    		}
    	}

    	function auto_oneup() {
    		if (count >= autoclickerprice) {
    			autocps += 1;
    			$$invalidate(1, count -= autoclickerprice);
    			increaseautoprice();
    		}
    	}

    	function increaseprice() {
    		$$invalidate(2, price *= exponent);
    	}

    	function increaseautoprice() {
    		$$invalidate(3, autoclickerprice *= exponent + 0.1415926535);
    	}

    	window.setInterval(
    		function () {
    			$$invalidate(1, count += autocps);
    		},
    		1000
    	);

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		name = this.value;
    		$$invalidate(0, name);
    	}

    	$$self.$capture_state = () => ({
    		name,
    		count,
    		upgrade,
    		price,
    		exponent,
    		autoclickerprice,
    		autocps,
    		cps,
    		oneup,
    		auto_oneup,
    		increaseprice,
    		increaseautoprice
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('count' in $$props) $$invalidate(1, count = $$props.count);
    		if ('upgrade' in $$props) upgrade = $$props.upgrade;
    		if ('price' in $$props) $$invalidate(2, price = $$props.price);
    		if ('exponent' in $$props) exponent = $$props.exponent;
    		if ('autoclickerprice' in $$props) $$invalidate(3, autoclickerprice = $$props.autoclickerprice);
    		if ('autocps' in $$props) autocps = $$props.autocps;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		name,
    		count,
    		price,
    		autoclickerprice,
    		cps,
    		oneup,
    		auto_oneup,
    		input_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
