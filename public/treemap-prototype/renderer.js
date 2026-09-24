// code by AL @ Figle
// D3 v7

// TO DO:
// - Load just necessary D3 modules
// - CMS feeding JSON
// - Add text, captions, project description
// - Progressive image load if cell larger than thumbnail
// - Display random featured image as bg at level 0
// - Add keywords to images (search)
// - Add JSON-LD structured data, rich cards, Google Tag Manager
// - Add XML sitemap generator via PHP
// - Update analytics only on user click, not auto-gallery
// - Add random values to cells on load and then change values and animate chart?


d3.json("./projects.json").then(data => {

  var baseURL = location.pathname,
    currentLoc = () => {
      return window.location.hash.length > 1 ?
      nodes.data.slug + window.location.hash.slice(1).replace(/\//g, "-") :
      nodes.data.slug
    },

    dispatcher = d3.history("updateState"),
    header = d3.select("header"),
    wrap = d3.select("main"),
    chart = d3.select("#chart"),
    info = d3.select("#info-wrapper"),
    showInfo = d3.select("#show-info"),

    width = chart.node().clientWidth,
      height = chart.node().clientHeight,
    rectPadding = window.screen.width < 640 ? 2 : 4,

    gridRes = 32,
    transTime = 600, // Live-site timing

    x = d3.scaleLinear()
      .domain([0, width])
      .rangeRound([0, width + rectPadding]),
      y = d3.scaleLinear()
      .domain([0, height])
      .rangeRound([0, height + rectPadding]),

    color = d3.scaleOrdinal()
      .range([
        d3.rgb(250, 200,   0),
        d3.rgb( 50,   0, 250),
        d3.rgb(250,   0,  50)
      ]
      //.range(d3.schemeDark2
        .map(c => {
          c = d3.rgb(c);
          //c.opacity = 0.5;
          return c;
        })
      ),

    treemap = d3.treemap()
        .size([width, height])
      //.tile(d3.treemapResquarify)
      .tile(d3.treemapSquarify)
        .paddingInner(0)
        .round(true), //true

    nodes = currentNode = d3.hierarchy(data)
      .eachBefore(d => d.data.id = (d.parent ? d.parent.data.id + "-" : "") + d.data.slug)
      //.sum(d => d.image ? 1 : 0),
      .sum(d => d.image ? prototypeWeight() : 0)
      .sort((a, b) => b.height - a.height || b.value - a.value),
      //.sort((a, b) => b.value - a.value),

    resizeTimer, idleTimer, currentChildren, currentDepth, toggleFeatured = true;

  treemap(nodes);

  const lightbox = createD3Lightbox({
    containerSelector: 'body',
    imagePathPrefix: 'https://lenart.pl/img/',
    transitionDuration: 400
  });

  chart
    .attr("width", width)
    .attr("height", height);

  var cells;
  if (window.prototypeHTML) {
    cells = createHTMLCells(chart, nodes, color, lightbox, d => {
      const path = d.ancestors().reverse().slice(1).map(n => n.data.slug).join("/");
      dispatcher.call("updateState", null, baseURL + (path ? "#/" + path : ""), d);
      zoom(d);
    });
  } else {
  cells = chart
    .selectAll("g")
    .data(nodes.descendants())
    .join("g")
    .attr("class", d => "node level-" + d.depth)
    //.attr("title", d => d.data.slug ? d.data.slug : "null")
    .attr("transform", d => "translate(" + x(d.x0) + "," + y(d.y0) + ")");

  cells
    .append("rect")
    .attr("id", d => d.data.id)
    .attr("width", d => x(d.x1) - x(d.x0) - rectPadding)
    .attr("height", d => y(d.y1) - y(d.y0) - rectPadding)
    .style("fill", d => {
      while (d.depth > 1) d = d.parent;
      return color(d.data.slug);
    });

  cells
    .append("clipPath")
    .attr("id", d => "clip-" + d.data.id)
    .append("use")
    .attr("xlink:href", d => "#" + d.data.id);

  cells
    .filter(d => d.depth < 3)
    .append("text")
    .attr("clip-path", d => "url(#clip-" + d.data.id + ")")
    .attr("class", "label")
    .attr("x", d => (x(d.x1) - x(d.x0)) / 2)
    .attr("y", d => (y(d.y1) - y(d.y0)) / 2)
    .text(d => d.data.title ? d.data.title : "?");

  cells
    .filter(d => d.depth < 3)
    .on("click", (event, d) => {
      loc = d.ancestors().map(d => d.data.slug).reverse(),
      locURL = loc.length > 1 ? baseURL + "#/" + loc.slice(1).join("/") : baseURL;
      dispatcher.call("updateState", this, locURL, d);
      zoom(d);
    });

  cells // thumb
    .filter(d => d.depth == 2)
    .append("svg")
    .attr("width", d => x(d.x1) - x(d.x0))
    .attr("height", d => y(d.y1) - y(d.y0))
    .append("image")
    //.attr("clip-path", d => "url(#clip-" + d.data.id + ")")
    .attr("href", d => d.data.thumb == null || d.data.thumb == "" ? "https://lenart.pl/img/__pixel.png" : "https://lenart.pl/img/" + d.data.thumb)
    .attr("class", "thumb")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("preserveAspectRatio", "xMidYMid meet");

  cells // image
    .filter(d => d.depth == 3)
    .append("svg")
    .attr("width", d => x(d.x1) - x(d.x0))
    .attr("height", d => y(d.y1) - y(d.y0))
    // if d.data.image ext is .jpg .png .gif append image
    // if d.data.image ext is .mp4 append foreignObject and video
    //.append(d => d.data.image.split('.').pop() == "mp4" ? "foreignObject" : "image")
    .append("image")
    .attr("clip-path", d => "url(#clip-" + d.data.id + ")")
    .attr("href", d => d.data.thumb ? "https://lenart.pl/img/" + d.data.thumb : "https://lenart.pl/img/" + d.data.image)
    .attr("class", "lores")
    //.attr("width", "100%")
    //.attr("height", "100%")
    .attr("preserveAspectRatio", "xMidYMid slice")
    // lightbox
    .on("click", function(event, d) {
      const projectImages = d.parent.children || [];

      lightbox.open(d, projectImages);
    });

  cells // reverse order
    .each((d, i) => d.data.idx = i)
    .sort((a, b) => b.data.idx - a.data.idx);

  }

  // header
  header.select("nav").selectAll("li")
    .on("click", () => {
      d3.select(this).select("section").classed("hide", false);
      header.classed("menu", true);
      chart.classed("menu", true);
      redraw();
    });

  // logo
  var parent = d3.select(".logo")
    .style("cursor", "pointer")
    //.datum(nodes)
    //.on("click", (event, d) => zoom(d));
    .on("click", () => {
      var locURL = baseURL;
      console.log("URL: " + locURL);
      dispatcher.call("updateState", this, locURL, nodes);
      zoom(nodes)
    });

  d3.select(window)
    .on('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(redraw, 250);
    })
    .on('popstate', () => {
      getURL(currentLoc());
    });
    //.on('load mousemove mousedown touchstart click keypress scroll', resetTimer);

  // get URL
  getURL(currentLoc());

  // functions
  function getURL(loc) {
    console.log("get loc: " + loc);
    currentNode = nodes.descendants().find(d => d.data.id === loc);
    zoom(currentNode || nodes);
  }

  function getBB(s) {
    s.each(function(d) { d.data.bbox = this.getBBox(); })
  }

  function updateAnalytics() {
    // Analytics deliberately omitted from local comparison.
  }

  // ZOOM
  function zoom(d) {

    console.log('zoom: ' + d.data.slug + ', depth: ' + d.depth + ', idx: ' + d.data.idx);

    document.title = d.data.title + " — Aleksander Lenart";

    document.head.querySelector('meta[name="description"]')
      .setAttribute("content", d.data.desc == null || d.data.desc == "" ? d.data.title : d.data.desc.replace(/(<([^>]+)>)/gi, ""));

    updateAnalytics();

    // if clicked a,b,c then stop rotating featured

    showPath(d.ancestors());

    currentDepth = d.depth;
    parent.datum(d.parent || nodes);

    if (currentDepth < 2) { // lores-hires
      d3.timeout(() => {
        cells
          .filter(d => d.depth == 3)
          .selectAll("image")
          .filter(".hires")
          .attr("href", d => d.data.thumb ? "https://lenart.pl/img/" + d.data.thumb : "https://lenart.pl/img/" + d.data.image)
          .attr("class", "lores");
      }, transTime + 5);
    } else {
      //?
    }

    if (currentDepth == 2) { // info
      var cImages = [];
      for (const c of d.children) {
        cImages.push(c.data.id);
      }
      cells
        .filter(d => cImages.includes(d.data.id))
        .selectAll("image")
        .filter(".lores") //?
        .attr("href", d => d.data.image ? "https://lenart.pl/img/" + d.data.image : false)
        .attr("class", "hires");

      showInfo // info open-close icon
        // if d.data.desc not null then show info icon after breadcrumb (global)
        // if @media width > X then show project info after zoom
        // and show X icon to close
        .classed("show", true)
        .on("click", () => {
          if (!chart.classed("info-on")) {
            info.html(d.data.desc == null || d.data.desc == "" ? `<h1>${d.data.title}</h1>` : d.data.desc);
            chart.classed("info-on", true);
            info.classed("show", true);
            //showInfo.classed("show", false);
            d3.timeout(() => {zoom(currentNode)}, transTime + 5);
          } else {
            chart.classed("info-on", false);
            info.classed("show", false);
            d3.timeout(() => {zoom(currentNode)}, transTime + 5);
          }
        });
    } else {
      showInfo.classed("show", false);
      chart.classed("info-on", false);
      if (info.classed("show")) { // fix open info
        info.classed("show", false);
        d3.timeout(() => {redraw()}, transTime + 5);
      }
    }

    // zoom in gradually through each depth?

    width = chart.node().clientWidth;
      height = chart.node().clientHeight;

    treemap.size([width, height]);

    x.domain([d.x0, d.x1]).range([0, width + rectPadding]);
    y.domain([d.y0, d.y1]).range([0, height + rectPadding]);

    var t = d3.transition()
        .duration(transTime)
        .ease(d3.easeExpInOut);

    //cells.data(nodes.descendants()); //?

    if (window.prototypeHTML) {
      animateHTMLCells(cells, x, y, rectPadding, transTime, d);
    } else {
    cells.transition(t)
      .attr("transform", d => "translate(" + x(d.x0) + "," + y(d.y0) + ")")
      .select("rect")
      .attr("width", d => x(d.x1) - x(d.x0) - rectPadding)
      .attr("height", d => y(d.y1) - y(d.y0) - rectPadding);

    cells.transition(t)
      .select("text")
      .attr("x", d => (x(d.x1) - x(d.x0)) / 2)
      .attr("y", d => (y(d.y1) - y(d.y0)) / 2);

    cells.transition(t)
      .select("svg")
      .attr("width", d => x(d.x1) - x(d.x0))
      .attr("height", d => y(d.y1) - y(d.y0));

    }

    cells // hide this depth and above
      .filter(d => d.ancestors())
      .classed("hide", d => d.children ? true : false);

    cells // show this depth + 1 and below
      .filter(d => d.depth >= currentDepth + 1)
      .classed("hide", false);

    currentNode = d;
  }

  function redraw() {
    console.log("redraw called");
    //treemap(nodes);
    zoom(currentNode || nodes);
  }

  function showPath(p) {

    var path = d3.select("#breadcrumb")
      .selectAll("h1")
      .data(p.map(d => d).reverse());

    path
      .exit()
      .remove();

        path.enter().append("h1").merge(path)
            .text(d => d.data.title)
            .attr("tabindex", 0).attr("role", "button")
            .on("click", (event, d) => {
                const path = d.ancestors().reverse().slice(1).map(n => n.data.slug).join("/");
                dispatcher.call("updateState", null, baseURL + (path ? "#/" + path : ""), d);
                zoom(d);
            }).on("keydown", function(event) {
                if (event.key === "Enter" || event.key === " ") { event.preventDefault(); this.click(); }
            });

  }

}).catch(error => { console.error(error); document.querySelector("main").textContent = "Could not load the prototype: " + error.message; });
