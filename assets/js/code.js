document.addEventListener('DOMContentLoaded', function(){ // on dom ready



  var cy = cytoscape({
    container: document.querySelector('#cy'), 
    //container: document.getElementById('cy'),  
    boxSelectionEnabled: true,
    zoomingEnabled: true,


    style: cytoscape.stylesheet()
    .selector('node')
    .css({
      'content': 'data(name)',
      'color': 'black',
      'background-color': 'data(color)',
      'background-image': 'data(url)',
      'background-width' : 'data(imagesize)',
      'background-height' : 'data(imagesize)',
      'width': 'data(backroudsize)',
      'height': 'data(backroudsize)',
      'top':'position(y)',
      'left':'position(x)',

    })
    .selector('edge')
    .css({
      'curve-style': 'bezier',
      'line-color': 'data(color)',
      'width': 1  
    })

    .selector(':selected')
    .css({
      'background-color': 'yellow',
      'line-color': 'yellow',

    })


    .selector('.zoom')
    .css({
      'background-width' : 180,
      'background-height':180,
      'width': 180,
      'height': 180
    })

    .selector('.faded')
    .css({
      'opacity': 0.1,
      'text-opacity': 0,
      'line-color' : 'yellow',


    })

    .selector('.hide')
    .css({
      'opacity': 0,
      'text-opacity': 0,
      'line-color' : 'yellow',

    }),


    elements: cytoscapeElements,


    layout: {
      name: 'preset',
      padding: 10
    }


  });


//   cy.elements().trigger('hover');

// $.each(cytoscapeElements.nodes, function (index, element) {
//   let nodeId = "#" + element.data.id;

//   cy.style().selector( nodeId ).css({
//    'background-image': 'url("public/img/' + element.data.backgroundimage +'")',
//    'background-width' :element.data.width ,
//    'background-height':element.data.height,
//    'background-size': '100%',
//    'width': element.data.width,
//    'height': element.data.width
//   });   
//   });



//when mouse hover highlight nodes
cy.on('mouseover', 'node', function(e){
  var node = e.cyTarget; 
  var neighborhood = node.neighborhood().add(node);
  
  cy.elements().addClass('faded');
  neighborhood.removeClass('faded');

});

cy.on('tap', 'node', function(e){
  var node= e.cyTarget;
  var neighborhood = node.neighborhood().add(node);
});




cy.on('mouseout', function(e){
  if( e.cyTarget === cy ){
    cy.elements().removeClass('faded');

  }
});


 


// see http://qtip2.com/


cy.on('tap', 'node', function(e){
  var node = e.cyTarget; 
  var neighborhood = node.neighborhood().add(node);
  
  cy.elements().addClass('hide');
  neighborhood.removeClass('hide');
  var j = neighborhood

  cy.animate({
    fit: {
      eles: j,
      padding: 2
    }
  }, {
    duration: 300
  });

});

cy.on('mouseout', function(e){

  cy.elements().removeClass('hide');


});


// add qtip for person
$.each(cytoscapeElements.nodes, function (index, element) {

      // console.log(index, element);

      cy.$('#' + element.data.id).on('mouseover', function(event){
        cy.$('#' + element.data.id).qtip({
         content: element.data.description,
         show: {
          event: event.type,
          ready: true
        },
        hide: {
          event: 'mouseout unfocus'
        },

        position:{
          my: 'center left',
          at: 'top center'

        },
        style: {
          classes: 'qtip-default',
          tip: {
            width: 16,
            height: 16
          }


        }
      }, event);

    });
});






}); // on dom ready