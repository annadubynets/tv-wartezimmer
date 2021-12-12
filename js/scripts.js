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