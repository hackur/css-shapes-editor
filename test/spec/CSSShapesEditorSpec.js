/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, runs, $, waitsForDone, spyOn */

// see main.js for path mapping config
define(['jquery', 'text!spec/test-files/markup.html', 'CSSShapesEditor', 'PolygonEditor', 'CircleEditor'],
function($, markup, CSSShapesEditor, PolygonEditor, CircleEditor){
    
    // create fixture placeholder for other suites
    $('body').append($('<div id="test-fixture"></div>'))
    
    describe('CSSShapesEditor', function(){
        var editor, 
            target, 
            value = 'polygon(nonzero, 0 0, 100px 0, 100px 100px)',
            $fixture = $('#test-fixture').html(markup);
            
        beforeEach(function(){
            // inject markup for test
            $fixture.html(markup)
            target = $('#test-shape')[0]
        })
        
        afterEach(function(){
            editor.remove()
            $fixture.empty()
        })

        it('should be defined', function(){
            editor = new CSSShapesEditor(target, value);
            expect(editor).toBeDefined();
        });

        it('should return instance of polygon editor', function(){
            var value = 'polygon(nonzero, 0 0, 100px 0, 100px 100px)';
            
            editor = new CSSShapesEditor(target, value);
            expect(editor instanceof PolygonEditor).toBe(true);
        });

        it('should return instance of polygon editor with type polygon', function(){
            var value = 'polygon(nonzero, 0 0, 100px 0, 100px 100px)';
            
            editor = new CSSShapesEditor(target, value);
            expect(editor instanceof PolygonEditor).toBe(true);
            expect(editor.type).toBe('polygon');
        });

        it('should return instance of circle editor', function(){
            var value = 'circle(50%, 50%, 50%)';
            
            editor = new CSSShapesEditor(target, value);
            expect(editor instanceof CircleEditor).toBe(true);
        });

        it('should throw error for unknown shape in value', function(){
            var value = 'fake-shape()';

            var setup = function() {
                editor = new CSSShapesEditor(target, value);
            };

            expect(setup).toThrow();
        });
        
        it('should throw error for invalid value', function(){
            var setupWithUndefined = function() {
                editor = new CSSShapesEditor(target, undefined);
            };

            var setupWithNull = function() {
                editor = new CSSShapesEditor(target, null);
            };

            var setupWithEmpty = function() {
                editor = new CSSShapesEditor(target, '');
            };

            var setupWithZero = function() {
                editor = new CSSShapesEditor(target, 0);
            };

            expect(setupWithUndefined).toThrow();
            expect(setupWithNull).toThrow();
            expect(setupWithEmpty).toThrow();
            expect(setupWithZero).toThrow();
        })

        it('should throw error for invalid target', function(){
            var setupWithUndefined = function() {
                editor = new CSSShapesEditor(undefined, value);
            };

            var setupWithNull = function() {
                editor = new CSSShapesEditor(null, value);
            };

            var setupWithEmpty = function() {
                editor = new CSSShapesEditor('', value);
            };

            var setupWithZero = function() {
                editor = new CSSShapesEditor(0, value);
            }; 
            
            
            expect(setupWithUndefined).toThrow();
            expect(setupWithNull).toThrow();
            expect(setupWithEmpty).toThrow();
            expect(setupWithZero).toThrow();
        });
    });
});

