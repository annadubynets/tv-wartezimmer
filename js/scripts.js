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