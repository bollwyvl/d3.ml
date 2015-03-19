;( function(){
  var template = d3.select("#template"),
    html = d3.select("#html"),
    preview = d3.select("#preview"),
    templateUrl = d3.select("#template-url"),
    win = d3.select(window);

  var editor = CodeMirror(template.node(), {
    theme: "blackboard",
    mode: "yaml",
    lineNumbers: true,
    lineWrapping: true,
    extraKeys: {"Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); }},
    foldGutter: {
      rangeFinder: new CodeMirror.fold.combine(
        CodeMirror.fold.indent,
        CodeMirror.fold.comment
      )
    },
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
  });

  var htmlViewer = CodeMirror(html.node(), {
    theme: "blackboard",
    mode: "text/html",
    lineNumbers: true,
    lineWrapping: true,
    readOnly: true
  });

  d3.select("#template").datum(1);
  d3.select("#load").datum(0);
  d3.select("#html").datum(0);
  d3.select("#preview").datum(1);

  d3.selectAll(".toggle")
    .on("click", function(){
      var toToggle = d3.select("#" + this.id.replace("toggle-", ""));

      toToggle.datum(!toToggle.datum())
        .style("display", function(d){return d ? "block" : "none"});
    });

  editor.on("change", update);
  win.on("resize", resize);
  templateUrl.on("change", updateHash);
  win.on("hashchange", load);

  win.on("resize")();

  if(hash()){
    templateUrl.property("value", hash());
  }
  templateUrl.on("change")();

  function hash(value){
    if(value){
      window.location.hash = value;
    }
    return window.location.hash.slice(1);
  }

  function updateHash(){
    hash(templateUrl.property("value"));
    win.on("hashchange")();
  }

  function load(){
    d3.text(hash(), "text/yaml", function(d){
      editor.setValue(d);
    });
  }

  function update(){
    d3.ml.templates = jsyaml.load( editor.getValue() );

    preview.call( function(s){
      s.html("");
      d3.entries(d3.ml.templates["display"])
        .forEach(function(d){
          if (d3.ml.templates[d.key][d.value] ){
            d3.ml.build( s, d3.ml.templates[d.key][d.value] );
          }
        });
      htmlViewer.setValue(
        vkbeautify.xml(s.html()).replace("\t", "  ")
      );
    });
  }

  function resize(){
    editor.setSize(null, win.node().innerHeight + "px");
  }
})();
