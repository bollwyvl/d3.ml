d3factory = function(s, template, state){
  if ( !s.data()[0]){
    s = s.datum( {} );
  }
  if (d3.templates[template][state]){
   return s = d3machine( s, d3.templates[template][state] )
  }
}

function d3machine( s, template ){
   // on each call get data if it exists in the selection
   // last data selection is always the current state of the 
   // data.  datum adds objects and data adds arrays data d3.entries(obj) adds an object array
   var s0 = s;
  // load data when it exists and it always exists on the first pass
   if ( s.data()[0] ){
     data = s.data()[0];
   }
  
   template.forEach( function(template){
       // do a thing in d3 and return the selection
       // selection node, inner template, current node data, global data
       s = d3process( s, d3.entries(template)[0], data)
     })
  return s;
}



function merge_object( d, _d, i ){
  d3.merge( [ d3.entries( d ), d3.entries( _d )] )
    .forEach( function(_d){
      i[ _d.key] = _d.value;
    })
  return i;
}

reduce_keys = function ( k, d, _d ){
  if (k[0] == '@'){    
  // local context
    d = _d;
  }
    
  if ( inset( k , [':','@'] ) ){
    return d
  } else if ( inset( k[0] , [':','@'] ) ){
    return k.slice(1).split('.')
     .reduce( function( p, n){ 
        if (p[n]){
          return p[n]
        } else {
          // default if key doesn't exist
          return {}
        }
         
       }, d );
  } else {
    return k;
  }

};

function inset(str, set ){
  return( 
    set.filter( function(d){
      return (d == str);           
    }).length > 0
  )
}

function d3process( s, d, data ){
  if ( d.key == 'call' ){
      s = s[d.key]( function(s){
        d3machine(s, d.value);
      })
   } else if (  d.key == 'template' ){
      // nested template perhaps
      d3machine(s, reduce_keys( d.value, d3.templates ) )
   } else if (  d.key == 'each' ){
      s = s[d.key]( function(){
        d3machine(d3.select(this), d.value);
      })
   } else if (  d.key == 'class' ){
      d3.entries( d.value )
        .forEach( function(_d){
          if (_d.value == null ){
            s.classed( _d.key, true ) 
          } else {
            s.classed( _d.key, _d.value  ) 
          }
           
        })
   } else if ( inset( d.key, ['attr','style'] ) ){
      d3.entries( d.value )
        .forEach( function(_d){
           s[d.key]( _d.key, function(__d){
             return reduce_keys( _d.value, data, __d ) 
           })
        })
   } else if ( inset( d.key, ['enter','exit','remove'] ) ){
     // data transformations 
     s = s[d.key]()
   } else if ( inset( d.key, ['data'] ) ){
     // append data from the archie base
     // update selection
     s = s[d.key]( function(_d){
       return reduce_keys( d.value, data, _d )
     })
   } else if ( inset( d.key, ['xml','json','yaml','yml','aml','plain','csv','tsv'] ) ){
     // append data from the archie base
     // update selection
     var parse = function(d){ return d;}
     if ( inset( d.key, ['yaml','yml' ] ) ){
          d.key = 'text'
          parse = function(d){
            return jsyaml.load(d);
          }
      } 
     if ( inset( d.key, ['aml' ] ) ){
          d.key = 'text'
          parse = function(d){
            return archieml.load(d);
          }
      } 
     if ( inset( d.key, ['plain' ] ) ){
          d.key = 'text'
      } 
     d3[d.key]( d.value, function(d){
       if ( d.key == 'aml' ){
          d = archieml.load( d )
        } 
        s = d3process( s, {
           key: 'datum',
           value: parse(d)
         }, data)
        
     })
   } else if ( inset( d.key, ['datum'] ) ){
     // append data from the archie base
     // selection doesn't change
     s = s[d.key]( function(_d){
        // previously attached data
        // previously attached data
        if (_d ){
          // merge objects
          if (typeof d.value == 'string'){
            // access predefined variables
            // allows arbitrary data
            d.value =  reduce_keys( d.value, data, _d)
          }
          return merge_object( _d, d.value, {} )
        } else {
          // attach data if it hasnt been assigned
          return d.value;
        }
     })
   } else if ( inset( d.key, ['selectAll','select','insert'] ) ){
     // selection changes
       s = s[d.key]( d.value );  
   } else if ( inset( d.key, ['append'] ) ){
     // selection changes
     if (d.value[0] == '$'){

       // I wish i knew regular expressions
       // this can probably be done with the function update by converting to a template
       var path = d.value.slice(1).split('.');
       if ( (path[0].length > 0) && ( path[0][0] != '#' ) ){
         // dont forget to update teh selection
         s = s.append( path[0] )
       } 
       // add classes
       path.slice(1).filter( function(path){
         return (path[0] != '#') && ( path[0].length > 0 )
       }).forEach( function(path){
         s.classed( path.split('#')[0], true);
       })
       path.filter( function(path){
         return (path.split('#')[1])
       }).forEach( function(path){
         // this will only happen once
         s.attr( 'id', path.split('#')[1] );
       })
     } else {
       // normal append
       s = s[d.key]( d.value );  
     }
       
   } else if ( inset( d.key, ['text','html'] ) ){
     // append data from the d3 base
      s[d.key]( function(_d){
          return reduce_keys( d.value, data, _d)
      })
   } else {
     //s[d.key]( d.value )
   }
  return s;
}---
---
<!DOCTYPE html>
<html lang="en">
    <head>
        <script src='//cdn.jsdelivr.net/g/d3js,codemirror'></script>
        <script src="templates.js"></script>
        
        <script src='https://cdnjs.cloudflare.com/ajax/libs/materialize/0.95.3/js/materialize.min.js'></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/js-yaml/3.2.7/js-yaml.min.js"></script>
        <style>
          @import "https://cdnjs.cloudflare.com/ajax/libs/materialize/0.95.3/css/materialize.min.css";
          @import "https://cdnjs.cloudflare.com/ajax/libs/codemirror/4.13.0/codemirror.min.css";
          @import "https://cdnjs.cloudflare.com/ajax/libs/codemirror/4.13.0/theme/blackboard.css";
          body {
            font-size: 12px;
          }
        </style>
    </head>
    <body>
      <div id="preview" class="mode row"></div>          
      <div id="template" class="mode"><h4>&nbsp;</h4><textarea></textarea></div>
      <div id="toggle"><a class="waves-effect waves-light btn">Editor</a></div>
      <script>
        ;( function(){
          d3.selectAll('.mode')
            .style('opacity','.8')
            
          d3.selectAll('#template')
            .style('position','absolute')                     
            .style('top','0px')                     
            .style('left','0px')            
        
          d3.selectAll('#toggle')
            .style('position','absolute')   
            .style('top','0px')                     
            .style('right','0px')                     
            .on('click', function(){
              var d = d3.select('#template')
                        .style('display')
              console.log( d )
              if (d == 'none'){
                d = 'block';
              } else {
                d = 'none';
              }
              d3.select('#template')
                        .style('display', d)
                
            })
          
            
        
          
          d3.text('materialize.yml', 'text/yaml', function(d){
            var n = d3.select('#template textarea').html(d);
            template = CodeMirror.fromTextArea( n.node(), {
              theme: "blackboard",
              lineWrapping: true
            })
            template.setSize( '100%', '100%')
            template.on('update', function(){
              d3.templates = jsyaml.load( template.getValue() );
              
              d3.select('#preview')
                .call( function(s){
                  s.html('')
                  d3.entries( d3.templates['display'] ).forEach( function(d){
                     d3factory( s, d.key, d.value )
                  })
               })
            })
          });
          
        })();
      </script>
    </body>
</html>
  