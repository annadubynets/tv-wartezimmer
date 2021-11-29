// init carousels
$(function() {
    if ($('.quick-access .owl-carousel').length > 0) {
        $('.quick-access .owl-carousel').owlCarousel({
            loop: true,
            margin: 60,
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
            margin: 60,
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
            margin: 60,
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