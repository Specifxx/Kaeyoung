// The motion layer (owner, 2026-11-06: "make it dynamic … when you're scrolling down something moving in smoothly …
// very smooth, the shopping experience is really important"). Two tiny inline scripts, no library:
//
// MOTION_BOOT runs in <head> before paint and stamps `<html data-motion>` unless the visitor asked for reduced motion
// (or `?motion=off`). Every animation in globals.css's motion block is keyed on it, so a reduced-motion visitor, an old
// browser or a crawler sees the page exactly as before.
//
// MOTION_SCRIPT runs at the end of <body>. It marks every `[data-reveal]` element already on screen as shown at once,
// and only THEN stamps `data-reveal-on`, the attribute the CSS needs before it hides anything. So nothing on screen is
// ever hidden, a page whose script fails shows everything, and the server HTML (every word, price and link) is the
// same: the motion is opacity and transform only, never layout. Off-screen ones ease in when they scroll into view
// (IntersectionObserver), including the ones a client navigation or the quick view adds (MutationObserver). It also
// stamps `data-scrolled` for the header's shadow. Nothing here reads or writes storage, a cookie or the network.

export const MOTION_BOOT = `(function(){try{var d=document.documentElement;if(!window.matchMedia||matchMedia("(prefers-reduced-motion: reduce)").matches||!("IntersectionObserver" in window)||/[?&]motion=off/.test(location.search))return;d.setAttribute("data-motion","")}catch(e){}})();`;

export const MOTION_SCRIPT = `(function(){try{var d=document.documentElement;if(!d.hasAttribute("data-motion"))return;var io=new IntersectionObserver(function(es){for(var i=0;i<es.length;i++){if(es[i].isIntersecting){es[i].target.setAttribute("data-in","");io.unobserve(es[i].target)}}},{rootMargin:"0px 0px -6% 0px",threshold:0.01});function scan(first){var n=document.querySelectorAll("[data-reveal]:not([data-seen])"),h=innerHeight||d.clientHeight;for(var i=0;i<n.length;i++){var el=n[i];el.setAttribute("data-seen","");if(first){var r=el.getBoundingClientRect();if(r.height>0&&r.top<h&&r.bottom>0){el.setAttribute("data-in","");el.setAttribute("data-instant","");continue}}io.observe(el)}}scan(true);d.setAttribute("data-reveal-on","");var q=0;new MutationObserver(function(){if(!q){q=1;requestAnimationFrame(function(){q=0;scan(false)})}}).observe(document.body,{childList:true,subtree:true});var s=0;function sc(){s=0;if((window.scrollY||0)>8)d.setAttribute("data-scrolled","");else d.removeAttribute("data-scrolled")}addEventListener("scroll",function(){if(!s){s=1;requestAnimationFrame(sc)}},{passive:true});sc()}catch(e){try{document.documentElement.removeAttribute("data-reveal-on")}catch(f){}}})();`;
