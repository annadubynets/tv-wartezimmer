// init carousels
$(function() {
    if ($('.quick-access .owl-carousel').length > 0) {
        $('.quick-access .owl-carousel').owlCarousel({
            loop: true,
            margin: 35,
            responsiveClass: true,
            autoplay: false,
            autoWidth: true,
            dots: false,
            nav: false,
            responsive: {
                0: {
                    items: 2,
                    stagePadding: 60,
                },
                992: {
                    items: 4
                }
            }
        })
    }

    if ($('.themed-packages .owl-carousel').length > 0) {
        $('.themed-packages .owl-carousel').owlCarousel({
            loop: true,
            margin: 35,
            responsiveClass: true,
            autoplay: false,
            autoWidth: true,
            dots: false,
            nav: false,
            responsive: {
                0: {
                    items: 1,
                    stagePadding: 60,
                },
                992: {
                    items: 2
                }
            }
        })
    }

    if ($('.vacation-messages .owl-carousel').length > 0) {
        $('.vacation-messages .owl-carousel').owlCarousel({
            loop: true,
            margin: 35,
            responsiveClass: true,
            autoplay: false,
            autoWidth: true,
            dots: false,
            nav: false,
            responsive: {
                0: {
                    items: 1,
                    stagePadding: 60,
                },
                992: {
                    items: 3
                }
            }
        })
    }

    if ($('.programs .owl-carousel').length > 0) {
        $('.programs .owl-carousel').owlCarousel({
            loop: true,
            margin: 35,
            responsiveClass: true,
            autoplay: false,
            dots: false,
            nav: false,
            responsive: {
                0: {
                    items: 1,
                    autoWidth: true,
                },
                768: {
                    items: 2,
                    autoWidth: true,
                },
                1200: {
                    items: 3,
                    autoWidth: false,
                }
            }
        })
    }
});

$(function() {
    $('.sidebar-toggler').on('click', function() {
        const sidebarSelector = $(this).data('target');
        $(this).toggleClass('expanded');
        $(sidebarSelector).toggleClass('show');
    })
});


/**
 * Initialize popover
 */
$(function() {
    const popoverElems = document.querySelectorAll('[data-bs-toggle=popover]');
    popoverElems.forEach((popoverElem) => {
        var popover = new bootstrap.Popover(popoverElem, {
            trigger: 'focus'
        })
    })

})

$(document).on('change', '.btn-file :file', function() {
    var input = $(this),
        numFiles = input.get(0).files ? input.get(0).files.length : 1,
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [numFiles, label]);
});

$(document).ready(function() {
    $('.btn-file :file').on('fileselect', function(event, numFiles, label) {
        console.log("teste");
        var input_label = $(this).closest('.input-group').find('.file-input-label'),
            log = numFiles > 1 ? numFiles + ' files selected' : label;

        if (input_label.length) {
            input_label.text(log);
        } else {
            if (log) alert(log);
        }
    });
});

$('.datepicker').datepicker('show');

/**
 * Full screen video player
 */

var FullScreenVideoPlayer = FullScreenVideoPlayer || {}

FullScreenVideoPlayer.show = function(videoSrc) {
    var playerModalElem = document.getElementById('video-viewer-modal');
    var playerElem = playerModalElem.querySelector('.video-player');
    if (!playerElem) {
        console.error('no player')
        return;
    }
    var playerModal = new bootstrap.Modal(playerModalElem, {
        keyboard: true
    });

    playerElem.src = videoSrc;
    playerModal.show();
    playerElem.play();
    playerElem.focus();

    playerModalElem.addEventListener('hidden.bs.modal', function (event) { 
        playerElem.pause();
        playerElem.currentTime = 0;
    });
}

$(function() {
    /**
     * Subscribe to the play-btn click of video-thumbnail control
     * NOTE: the element with the class video-thumbnail should have 
     *       data-video-src attribute with the url to the video, which should be played
     */

    $('.video-thumbnail .play-btn').on('click', function(e) {
        e.preventDefault();

        var playButton = e.target;
        var videoThumbnail = playButton.closest('.video-thumbnail');
        var url = videoThumbnail && 
                  videoThumbnail.hasAttribute('data-video-src') && 
                  videoThumbnail.getAttribute('data-video-src');

        if (url) {
            FullScreenVideoPlayer.show(url);
        }
    })
});


// date range picker setup
$(function() {
    $(function() {
        $('input[name="daterange"]').daterangepicker({
            opens: 'left',
            autoUpdateInput: true,
            startDate: moment(),
            endDate: moment().startOf('day').add(7, 'day'),
            locale: {
                format: 'DD.MM.YYYY',
                applyLabel: "Übernehmen",
                cancelLabel: "Abbrechen",
                fromLabel: "Von",
                toLabel: "bis",
                daysOfWeek: [
                    "So",
                    "Mo",
                    "Di",
                    "Mi",
                    "Do",
                    "Fr",
                    "Sa"
                ],
                monthNames: [
                    "Januar",
                    "Februar",
                    "Marsch",
                    "April",
                    "Kann",
                    "Juni",
                    "Juli",
                    "August",
                    "September",
                    "Oktober",
                    "November",
                    "Dezember"
                ],
            }
        }, function(start, end, label) {
          console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
        });
      });
})
