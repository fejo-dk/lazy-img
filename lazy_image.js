/* eslint-env browser */
import isVisible from "uitil/dom/visibility";
import { replaceNode } from "uitil/dom";
import debounce from "uitil/debounce";

const DEFAULTS = {
  delay: 100, // milliseconds
  tolerance: 10 // pixels
};

class LazyImage extends HTMLElement {
  connectedCallback () {
    this.classList.add("is-enhanced");

    // numeric attributes -- TODO: update cached properties when DOM changes
    ["delay", "tolerance"].forEach(param => {
      let value = this.getAttribute(param);
      this[param] = value ? parseInt(value, 10) : DEFAULTS[param];
    });

    let checkViz = this.checkVisibility;
    this.checkVisibility = debounce(this.delay, this, checkViz);
    window.addEventListener("scroll", this.checkVisibility);
    checkViz.call(this); // NB: not debounced
  }

  disconnectedCallback () {
    window.removeEventListener("scroll", this.checkVisibility);
  }

  checkVisibility () {
    // wait for reflow, just in case it's a newly added node (which would otherwise
    // have zero dimensions and might thus falsely pass the visibility check)
    requestAnimationFrame(_ => {
      // `#expanded` check guards against stray debounced handlers
      if (isVisible(this.link, this.tolerance) && !this.expanded) {
        this.expand();
      }
    });
  }

  // replaces `<lazy-img>` with `<img>`
  expand () {
    let { link } = this;

    let img = document.createElement("img");
    img.src = link.href;
    img.alt = link.textContent.trim(); // NB: no markup allowed
    // indicate pending state
    img.className = "lazy"; // intentionally redundant for readability
    img.setAttribute("aria-busy", "true");
    img.onload = ev => {
      img.className = "";
      img.removeAttribute("aria-busy");
      img.onload = null;
    };

    replaceNode(this, img);
    // retain (transfer) data attributes -- TODO: document
    [].forEach.call(this.attributes, attr => {
      let { name } = attr;
      if (name.indexOf("data-") === 0 && !img.getAttribute(name)) {
        img.setAttribute(name, attr.value);
      }
    });
    this.expanded = true;
  }

  get src () {
    let { link } = this;
    return link && link.href;
  }

  set src (uri) {
    let { link } = this;
    if (link) {
      link.href = uri;
    }
  }

  get link () {
    return this.querySelector("a");
  }
}

customElements.define("lazy-img", LazyImage);
