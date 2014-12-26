(function($) {
    "use strict";

    window.Fretboard = function(options, $element) {
        var self = this,
            $window = $(window),
            fretboardContainerCssClass = "fretboard-container",
            bodyCssClass = "body",
            bodySelector = "." + bodyCssClass,
            stringContainerCssClass = "string-container",
            stringContainerSelector = "." + stringContainerCssClass,
            noteCssClass = "note",
            noteSelector = "." + noteCssClass,
            letterCssClass = "letter",
            letterSelector = "." + letterCssClass,
            stringCssClass = "string",
            stringSelector = "." + stringCssClass,
            fretLineCssClass = "fret-line",
            fretLineSelector = "." + fretLineCssClass,
            hoverCssClass = "hover",
            clickedCssClass = "clicked",
            clickedSelector = "." + clickedCssClass,
            // The value for C needs to be first
            DEFAULT_NOTE_LETTERS = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "Ab/G#", "A", "A#/Bb", "B"],
            DEFAULT_TUNING = [{
                "letter": "E",
                "octave": 5
            }, {
                "letter": "B",
                "octave": 5
            }, {
                "letter": "G",
                "octave": 4
            }, {
                "letter": "D",
                "octave": 4
            }, {
                "letter": "A",
                "octave": 4
            }, {
                "letter": "E",
                "octave": 3
            }],
            defaults = {
                allNoteLetters: DEFAULT_NOTE_LETTERS,
                tuning: DEFAULT_TUNING,
                numFrets: 15,
                isChordMode: true,
                noteClickingDisabled: false,
            },
            settings = {};
            
        // Make a copy of the options that were passed in, just in case the 
        // user modifies that object. Then extend it with the defaults.
        $.extend(settings, defaults, $.extend(true, [], options));
        
        console.log("Settings: ");
        console.log(settings);

        validate();
        init();

        function init() {
            var $fretboardBody = getFretboardBodyEl(),
                numStrings = settings.tuning.length,
                numFrets = settings.numFrets,
                timer;
            
            $element.addClass(fretboardContainerCssClass);
            $element.append($fretboardBody);
            
            setDimensions(true, true, true, true);
            
            // Track browser resizing so we only recalculate positions on the 
            // last resize after X milliseconds
			$window.on("resize",function() {
				clearTimeout(timer);
		
				timer = setTimeout(function() {
                    setDimensions(false, true, true, true);
                }, 50);
			});
        }
        
        self.setChordMode = function(isChordMode) {
            settings.isChordMode = isChordMode;
        }
        
        self.getClickedNotes = function() {
            var clickedNotes = [];
            
            $element
                .find(noteSelector + clickedSelector)
                .each(function() {
                    clickedNotes.push($(this).data('noteData'));
                });
                
            return clickedNotes;
        }
        
        self.setNoteClickingDisabled = function(isDisabled) {
            settings.noteClickingDisabled = isDisabled;
        }
        
        self.setTuning = function(tuning) {
            var clickedNotes = self.getClickedNotes(),
                $fretboardBody = $element.find(bodySelector),
                $stringContainers = $element.find(stringContainerSelector),
                newTuning = $.extend(true, [], tuning),
                oldTuning = $.extend(true, [], settings.tuning),
                oldTuningLength = oldTuning.length,
                tuningLength = tuning.length,
                tuningNote,
                i;
           
            settings.tuning = newTuning;
            
            debugger;
            
            // If the new tuning has at least as many strings as the old
            // tuning, modify/add strings to the DOM.
            if (tuningLength >= oldTuningLength) {
                // Handle addition or modification of strings
                for (i = 0; i < tuningLength; i++) {
                    tuningNote = newTuning[i];
                    
                    // If a string exists, alter it
                    if (i < oldTuningLength) {
                    
                    } else {
                        $fretboardBody.append(getStringContainerEl(tuningNote));
                    }
                }
            } else {
                // Remove strings from the DOM
                for (i = newTuningLength; i < oldTuningLength; i++) {
                    $($stringContainers[i]).remove();
                }
            }
            
            setDimensions(false, true, true, true);
            //validate();   
            //$element.empty();
            //init();
            //self.setClickedNotes(clickedNotes); 
        }
        
        self.setNumFrets = function(numFrets) {
            var clickedNotes = self.getClickedNotes();
            
            $element.empty();
            settings.numFrets = numFrets;
            //validate();
            init();
            self.setClickedNotes(clickedNotes);
        }
        
        self.setClickedNotes = function(notesToClick) {
            var notesToClickLength = notesToClick.length, 
                tuning = settings.tuning,
                tuningLength = tuning.length,
                i, 
                j,
                tuningNote,
                noteToClick,
                stringItsOn,
                $stringContainer,
                $note;
            
            if (!notesToClick) {
                return;
            }
            
            // For each note that needs to be clicked check its stringItsOn
            // property to see if it matches a note object in the tuning array.
            // If it does, get the of the matched note in the tuning array and 
            // get the find the corresponding $stringContainer and click its 
            // note.
            
            for (i = 0; i < notesToClickLength; i++) {
                noteToClick = notesToClick[i];
                stringItsOn = noteToClick && noteToClick.stringItsOn;
                
                if (!stringItsOn) {
                    continue;
                }
                
                for (j = 0; j < tuningLength; j++) {
                    tuningNote = tuning[j];
                    
                    if (notesAreEqual(tuningNote, stringItsOn)) {
                        $stringContainer = $($element.find(stringContainerSelector)[j]);
                        $note = $($stringContainer.find(noteSelector)[noteToClick.fretNumber]);
                        
                        if (!$note.hasClass(clickedCssClass)) {
                            // Make it behave the same as if you hovered over and clicked it
                            $note.trigger("mouseover").trigger("click");
                        }
                    }
                }   
            }
        }
        
        function notesAreEqual(note1, note2) {
            return note1.letter === note2.letter && note1.octave === note2.octave;
        }
        
        function getFretboardBodyEl() {
            var numStrings = settings.tuning.length,
                numFrets = settings.numFrets,
                $fretboardBody = $("<div class='" + bodyCssClass + "'></div>"),
                $stringContainer,
                $fretLine,
                openNote,
                i;
                
            for (i = 0; i < numStrings; i++) {
                openNote = settings.tuning[i];
                $stringContainer = getStringContainerEl(openNote);
                $fretboardBody.append($stringContainer);
            }
            
            for (i = 0; i <= numFrets; i++) {
                $fretLine = getFretLine();
                $fretboardBody.append($fretLine);
            }
            
            return $fretboardBody;
        }
        
        function getStringContainerEl(openNote) {
            var $stringContainer = $("<div class='" + stringContainerCssClass + "'></div>"),
                numFrets = settings.numFrets,
                $note,
                noteData,
                i;
            
            for (i = 0; i <= numFrets; i++) {
                noteData = getNoteByFretNumber(openNote, i);
                
                $note = getNoteEl({
                    letter : noteData.letter,
                    octave: noteData.octave,
                    fretNumber: i,
                    stringItsOn: openNote
                });
                
                $stringContainer.append($note);
            }
            
            $stringContainer.append(getStringEl());
            
            return $stringContainer;
        }
        
        function getStringEl() {
            return $("<div class='" + stringCssClass + "'></div>");
        }

        function getNoteEl(noteData) {
            var $note, 
                $letter;

            $letter = getLetterEl(noteData.letter);

            $note = $("<div class='" + noteCssClass + "'></div>")
                .on("mouseenter", noteMouseEnter)
                .on("mouseleave", noteMouseLeave)
                .on("click", function() {
                    var $clickedNote = $(this);
                    
                    if (settings.noteClickingDisabled) {
                        return;
                    }
                    
                    if($clickedNote.hasClass(clickedCssClass)) {
                        $clickedNote
                            .removeClass(clickedCssClass)
                            .on("mouseenter", noteMouseEnter)
                            .on("mouseleave", noteMouseLeave);
                    } else {
                        $clickedNote
                            .addClass(clickedCssClass)
                            .off("mouseenter", noteMouseEnter)
                            .off("mouseleave", noteMouseLeave); 
                    }
                    
                    // If we're in chord mode then get rid of all of the
                    // other clicked notes
                    if (settings.isChordMode) {
                        $clickedNote
                            .closest(stringContainerSelector)
                            .find(noteSelector + clickedSelector)
                            .each(function() {
                                var $otherNote = $(this);
                                
                                // Compare the actual DOM elements (the jQuery wrappers 
                                // will have different references)
                                if ($clickedNote[0] !== $otherNote[0]) {
                                    $otherNote
                                        .removeClass(clickedCssClass)
                                        .removeClass(hoverCssClass)
                                        .on("mouseenter", noteMouseEnter)
                                        .on("mouseleave", noteMouseLeave);
                                }
                            });
                            
                    }
                })
                .append($letter)
                .data('noteData', noteData);

            return $note;
        }
        
        function getLetterEl(letter) {
            return $("<div class='" + letterCssClass + "'>" + letter + "</div>");
        }
        
        function getFretLine() {
            return $("<div class='" + fretLineCssClass + "'></div>");
        }
        
        // Calculate default widths/heights. They can be overridden in CSS.
        function setDimensions(animateBody, animateNotes, animateFretLines, animateStrings) {
            var numFrets = settings.numFrets,
                numStrings = settings.tuning.length,
                $fretboardBody = $element.find(bodySelector),
                fretboardBodyHeight = $fretboardBody.height(),
                fretboardBodyWidth = $fretboardBody.width(),
                $stringContainers = $element.find(stringContainerSelector),
                $fretLines = $element.find(fretLineSelector),
                fretboardBodyRightPosition,
                fretboardContainerRightPosition,
                fretWidthInPixels,
                fretHeightInPixels;
            
            $fretboardBody
                .removeClass()
                .addClass(bodyCssClass)
                .addClass("strings-" + numStrings)
                .addClass("frets-" + numFrets);
                
            // Remove any classes that were added before since there might be a different
            // number of strings/frets now.
            $fretLines.removeClass("first").removeClass("last");
            $stringContainers.removeClass("first").removeClass("last");
            
            fretboardBodyRightPosition = $fretboardBody.offset().left + $fretboardBody.outerWidth();
            fretboardContainerRightPosition = $element.offset().left + $element.outerWidth();
            fretWidthInPixels = fretboardBodyWidth / (numFrets + 1);
            fretHeightInPixels = fretboardBodyHeight / numStrings;
            
            $fretLines.each(function(fretNum, fretLineEl) {
                var fretLeftVal = fretNum * fretWidthInPixels,
                    $fretLine = $(fretLineEl);
                
                if (fretNum === 0) {
                    $fretLine.addClass("first");
                } else if (fretNum === numFrets) {
                    $fretLine.addClass("last");
                }
                
                $fretLine.animate({
                    left: fretLeftVal + fretWidthInPixels - ($fretLine.outerWidth() / 2),
                    height: fretboardBodyHeight
                },  { duration: animateFretLines ? 500 : 0, queue: false } );
            });
            
            /*
            $fretboardBody
                .css({
                    height: 0
                })
                .animate({
                    height: fretboardBodyHeight,
                    width: fretboardBodyWidth
                }, { 
                    duration: animateBody ? 500 : 0, 
                    queue: false, 
                    complete: function() {
                        $fretboardBody.css({
                            height: "",
                            width: ""
                        });
                    }
                }); */
            
            $stringContainers.each(function(stringNum, stringContainerEl) {
                var $stringContainer,
                    $string,
                    $notes,
                    $note,
                    noteWidth,
                    noteHeight,
                    fretLeftVal,
                    fretTopVal,
                    noteLeftVal,
                    noteTopVal,
                    $fretLine;
                    
                $stringContainer = $(stringContainerEl);
                
                if (stringNum === 0) {
                    $stringContainer.addClass("first");
                } else if (stringNum === numStrings - 1) {
                    $stringContainer.addClass("last");
                }
                
                $string = $stringContainer.find(stringSelector);
                $notes = $stringContainer.find(noteSelector);
                
                $notes.each(function(fretNum, noteEl) {
                    $note = $(noteEl);
                    noteWidth = $note.outerWidth();
                    noteHeight = $note.outerHeight();
                    
                    fretLeftVal = fretNum * fretWidthInPixels;
                    fretTopVal = stringNum * fretHeightInPixels;
                    noteLeftVal = fretLeftVal + ((fretWidthInPixels / 2) - (noteWidth / 2));
                    noteTopVal = fretTopVal + ((fretHeightInPixels / 2)  - (noteHeight / 2));
                    
                    // queue: false means run the animations together (not one after the other)
                    $note.animate({
                        left: noteLeftVal,
                        top: noteTopVal
                    }, { duration: animateNotes ? 500 : 0, queue: false });
                });
                
                // Set the string position across the note, taking into account the string's thickness
                $string.animate({
                    top: noteTopVal + (noteHeight / 2)  - ($string.outerHeight() / 2)
                }, { duration: animateStrings ? 500 : 0, queue: false } );
            });
            
            /* If the body is bigger than the container put a scroll on the container.
               We don't always want overflow-x scroll to be there because the scroll 
               will show even when not needed and looks ugly. */
            if (fretboardBodyRightPosition >= fretboardContainerRightPosition) {
                $element.css("overflow-x", "scroll");
            } else {
                $element.css("overflow-x", "hidden");
            }
           
            $element.trigger("dimensionsSet");
        }
        
        function getNoteByFretNumber(stringNote, fretNumber) {
            var fretOffset = settings.allNoteLetters.indexOf(stringNote.letter) + fretNumber,
                numOctavesAboveString = Math.floor(fretOffset / 12);
                
                // Reduce the index by the correct amount to get it below 12
                fretOffset = fretOffset - (12 * numOctavesAboveString);

            return { 
                letter: settings.allNoteLetters[fretOffset],
                octave: stringNote.octave + numOctavesAboveString
            }
        }
        
        function noteMouseEnter() {
            $(this).addClass(hoverCssClass);
        }
        
        function noteMouseLeave() {
            $(this).removeClass(hoverCssClass);
        }

        function validate() {
            validateAllNoteLetters();
        }

        function validateAllNoteLetters() {
            if (settings.allNoteLetters.length !== 12) {
                throw "allNoteLetters is not valid: " + settings.allNoteLetters;
            }
        }
    };
})(jQuery);

if (!Array.isArray) {
    Array.isArray = function(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

// The jQuery plugin
(function($) {
    "use strict";

    $.fn.fretboard = function(options) {
        // The plugin will be called like this:
        // $('.fretboard-container').fretboard({ ... });
        // Iterate over each element in the jQuery 
        // collection, initializing a fretboard.   
        return this.each(function() {
            var $element = $(this),
                fretboard;

            // Return early if this element already has a plugin instance.
            // Otherwise, place a fretboard object on the element's data
            if ($element.data('fretboard')) return;

            fretboard = new Fretboard(options, $element);

            $element.data('fretboard', fretboard);
        });
    };
})(jQuery);
