if (!Object.entries) {
    Object.entries = function( obj ){
      var ownProps = Object.keys( obj ),
          i = ownProps.length,
          resArray = new Array(i); // preallocate the Array
      while (i--)
        resArray[i] = [ownProps[i], obj[ownProps[i]]];
  
      return resArray;
    };
}

var MovieRating = MovieRating || {};
MovieRating.LIKE = 1;
MovieRating.DISLIKE = -1;

var MovieDefaults = {};
MovieDefaults.POSTER_THUMBNAIL = 'images/video.png';

/**
 * Manages the movies booking page
 * @param {*} options - controller settings:
 *      ex:
 *             {
 *                  api: {
 *                      movies: './data/movies.json',
 *                      movieDetails: 'https://en4lzo1vrtnaahx.m.pipedream.net/movies/'
 *                      rating: 'https://enghrwur11dut.x.pipedream.net/rating',
 *                      booking: 'https://enghrwur11dut.x.pipedream.net/booking',
 *                  }
 *             }
 */
function FilmsBookingController(options) {
    this._apiHelper = new ApiHelper(options.api || {});
    this._bookedMovies = [];
    this._availableMovies = [];
    this._availableMoviesPagination = false;
    this._medicineFields = [];
    this._searchBar = false;
    this._bookedMoviesController = new BookedMoviesController('.booked-movies-list-screen');
    this._movieThumbnailController = false;

    this.init = function() {
        this._initMovieThumbnailController();

        this._fetchInitialData({
            success: function() { 
                this._setupSearchBar()
                this._initPagination()
                this._renderManageScreen()
            }.bind(this),
            error: function(error) { this._showError(error) }.bind(this)
        });
    }

    this._initMovieThumbnailController = function() {
        this._movieThumbnailController = new MovieThumbnailController({
            dispatchers: {
                bookMovie: this._bookMovie.bind(this),
                unbookMovie: this._unbookMovie.bind(this),
                toggleRating: this._toggleMovieRating.bind(this),
                getMovieInfo: this._handleGetMovieInfo.bind(this),
            }
        });

        this._movieThumbnailController.init();

        this._bookedMoviesController.init(this._handleScreenSizeChange.bind(this));
    }

    this._bookMovie = function(movieId, callback) {
        var movie = this._availableMovies.find(function(movie) {
            return movie.id == movieId
        });

        if (!movie) {
            console.error(`no unbooked movie with id: ${movieId}`)
            callback(false);
            return;
        }

        this._apiHelper.toggleBookMovie(movie.id, true)
            .done(function(data) {
                this._availableMovies = this._availableMovies.filter(function(elem) { return elem.id != movie.id })
                movie.booked = true;
                this._bookedMovies.push(movie);
                callback(movie);
                this._renderManageScreen();
            }.bind(this))
            .fail(function(e) {
                console.error("Can't post book request:", e.statusText);
                callback(false, e);
            })
    }

    this._unbookMovie = function(movieId, callback) {
        var movie = this._bookedMovies.find(function(movie) {
            return movie.id == movieId
        });

        if (!movie) {
            console.error(`no booked movie with id: ${movieId}`)
            callback(false);
            return;
        }

        // TODO: show please wait dialog
        this._apiHelper.toggleBookMovie(movie.id, false)
            .done(function(data) {
                this._bookedMovies = this._bookedMovies.filter(function(elem) { return elem.id != movie.id })
                movie.booked = false;
                this._availableMovies.push(movie);
                callback(movie)
                this._renderManageScreen();
            }.bind(this))
            .fail(function(e) {
                console.error("Can't post book request:", e.statusText);
                callback(false, e);
            })
    }

    this._toggleMovieRating = function(movieId, rating, callback) {
        var movie = this._findMovie(movieId);
        if (!movie) {
            console.error(`movie with id: ${movieId} was not found`);
            callback(false);
            return;
        }

        var newRating = rating == movie.rating ? null : rating;
        this._apiHelper.saveRating(movieId, newRating)
            .done(function() {
                movie.rating = newRating;
                callback(movie);
            }.bind(this))
            .fail(function(e) {
                console.error("Can't post rating request:", e.statusText);
                callback(false, e);
            })
    }

    this._findMovie = function(movieId) {
        return this._availableMovies.find(function(movie) { return movie.id == movieId }) ||
                this._bookedMovies.find(function(movie) { return movie.id == movieId });
    }

    this._handleGetMovieInfo = function(movieId, callback) {
        callback(this._findMovie(movieId));
    };

    this._handleScreenSizeChange = function(e) {
        this._renderBookedMovies();
    };

    this._renderBookedMovies = function() {
        this._bookedMoviesController.renderMovieThumbnails(this._bookedMovies);
    }


    /**
     * Gets initial data with the all films and categories
     */
    this._fetchInitialData = function(callbacks) {
        this._apiHelper.getMovies().done(function(data) {
            console.log(data);

            for (var id in data.docMovies){
                if (data.docMovies.hasOwnProperty(id)) {
                    var film = data.docMovies[id]
                    if (film.booked) {
                        this._bookedMovies.push(film);
                    } else {
                        this._availableMovies.push(film);
                    }
                }
            }

            for (var id in data.medicineFields){
                if (data.medicineFields.hasOwnProperty(id)) {
                    this._medicineFields.push(data.medicineFields[id]);
                }
            }

            console.debug('Booked: ', this._bookedMovies.length);
            console.debug('Available: ', this._availableMovies.length);
            console.debug('Categories: ', this._medicineFields.length);

            callbacks.success();
        }.bind(this)).fail(function(e) {
            console.error("Can't fetch data:", e.statusText)
            callbacks.error(e.statusText);
        });
    }

    this._setupSearchBar = function() {
        this._searchBar = new SearchBarController($('.search-block'), this._medicineFields, function() {
            this._renderAvailableMovies()
        }.bind(this))

        this._searchBar.init();
    }

    this._initPagination = function() {
        this._availableMoviesPagination = new PaginationController(
            $('.available-movies .movies-pagination'),
            18,
            function() { this._renderManageScreen() }.bind(this)
        );
    }

    this._renderManageScreen = function() {
        this._renderBookedMovies();
        this._renderAvailableMovies();

        this._showScreen('manage-movies-block');
    }

    this._renderAvailableMovies = function() {
        var movies = this._getAvailableMovies();
        var jqRootMoviesContainer = $('.available-movies-list-container');
        jqRootMoviesContainer.find('.available-movie-container').remove();
        jqRootMoviesContainer.find('.no-available-movies-block').toggleClass('d-none', !!movies.length)
        var jqMovieContainerTemplate = $('.movie-block-template');
        movies.forEach(function(movie) {
            var jqMovieContainer = $(
                `
                    <div class="available-movie-container col-lg-6 col-xl-6 col-xxl-4 pb-4">
                        ${jqMovieContainerTemplate.html()}
                    </div>
                `
            );
            var jqThumbnailElem = jqMovieContainer.find('.video-thumbnail');
            MovieThumbnailUtils.refreshThumbnailState(jqThumbnailElem, movie);
            jqRootMoviesContainer.append(jqMovieContainer);
        }.bind(this))
    }

    this._getAvailableMovies = function() {
        var movies = this._getFilteredAvailableMovies();
        return this._applyPagination(movies);
    }

    this._getFilteredAvailableMovies = function() {
        return this._searchBar.filter(this._availableMovies);
    }

    this._applyPagination = function(movies) {
        this._availableMoviesPagination.setup(movies.length);
        var startIndex = this._availableMoviesPagination.currentPage * this._availableMoviesPagination.itemsPerPage;
        return movies.slice(
            startIndex,
            startIndex + this._availableMoviesPagination.itemsPerPage
        );
    }


    this._showError = function(errorMessage) {
        $('.error-block').find('.alert').text(errorMessage);
        this._showScreen('error-block');
    }

    this._showScreen = function(selector) {
        this._hideAllScreens();
        $(`.${selector}`).removeClass('d-none');
    }

    this._hideAllScreens = function() {
        $('.state-screen').addClass('d-none');
    }
}


/**
 * Manages pagination of available movies
 * 
 * @param {*} jqRootElement - the root pagination container
 * @param {*} itemsPerPage
 * @param {*} changePageCallback 
 */
function PaginationController(jqRootElement, itemsPerPage, changePageCallback) {
    this.jqRootElement = jqRootElement;
    this.jqFirstPage = this.jqRootElement.find('.first-page');
    this.jqPrevPage = this.jqRootElement.find('.prev-page');
    this.jqNextPage = this.jqRootElement.find('.next-page');
    this.jqLastPage = this.jqRootElement.find('.last-page');
    this.changePageCallback = changePageCallback || function(){};
    this.itemsPerPage = itemsPerPage || 9;
    this.currentPage = 0;
    this.countPages = 0;
    

    this._init = function() {
        this.jqFirstPage.on('click', function(e) {
            e.preventDefault();
            this._changePage(0);
        }.bind(this));

        this.jqPrevPage.on('click', function(e) {
            e.preventDefault();
            this._changePage(this.currentPage - 1);
        }.bind(this));

        this.jqNextPage.on('click', function(e) {
            e.preventDefault();
            this._changePage(this.currentPage + 1);
        }.bind(this));

        this.jqLastPage.on('click', function(e) {
            e.preventDefault();
            this._changePage(this.countPages - 1);
        }.bind(this));
    }

    this._changePage = function(pageNumber) {
        if (pageNumber <= 0) {
            pageNumber = 0;
        } else if (pageNumber + 1 >= this.countPages) {
            pageNumber = this.countPages - 1;
        }

        if (this.currentPage != pageNumber) {
            this.currentPage = pageNumber;
            this.changePageCallback();
        }

        this._render();
    }

    this._init();


    this.setup = function(itemsCount) {
        itemsCount = itemsCount || 0;
        this.countPages = Math.ceil(itemsCount / this.itemsPerPage);
        
        if (this.countPages - 1 < this.currentPage) {
            this._changePage(0);
        } else {
            this._render();
        }
    }

    this._render = function() {
        this.jqRootElement.toggleClass('d-none', this.countPages === 0);
        this.jqRootElement.find('.current-page').text(this.currentPage + 1);
        this.jqRootElement.find('.max-pages').text(this.countPages);
        this.jqFirstPage.closest('.page-item').toggleClass('disabled', this.currentPage == 0);
        this.jqPrevPage.closest('.page-item').toggleClass('disabled', this.currentPage == 0);
        this.jqNextPage.closest('.page-item').toggleClass('disabled', this.currentPage >= this.countPages - 1);
        this.jqLastPage.closest('.page-item').toggleClass('disabled', this.currentPage >= this.countPages - 1);
    }
}


/**
 * Manages the search bar on films booking page
 * 
 * @param {*} jqRootElement 
 * @param {*} categories 
 * @param {*} onFilterChangeCallback 
 */
function SearchBarController(jqRootElement, categories, onFilterChangeCallback) {
    this.categoriesFilter = jqRootElement.find('select.categories-filter');
    this.showAllBtn = jqRootElement.find('.filter-btn-show-all');
    this.searchInput = jqRootElement.find('input[type=search]');
    this.searchBtn = jqRootElement.find('.btn-search');
    this.onFilterChangeCallback = onFilterChangeCallback || function() {}


    this.init = function() {
        this._setupCategories();
        this._setupShowAllBtn();
        this._setupTextSearch();
    }

    this._setupCategories = function() {

        categories.forEach(function(category) {
            this.categoriesFilter.append($('<option>', {
                value: category.id,
                text: category.name
            }));
        }.bind(this))
        
        this.categoriesFilter.selectpicker('refresh');

        this.categoriesFilter.on('change', function() {
            this.onFilterChangeCallback();
        }.bind(this));
    }

    this._setupShowAllBtn = function() {
        var showAllBtn = $('.filter-btn-show-all');
        showAllBtn.on('click', this._resetFilter);
    }

    this._resetFilter = function() {
        if (this.categoriesFilter) {
            this.categoriesFilter.selectpicker('val', '');
            this.searchInput.val('');
            this.onFilterChangeCallback();
        }
    }.bind(this);

    this._setupTextSearch = function() {
        this.searchInput.on("search", function(event) {
            this.searchBtn.trigger("click");
        }.bind(this));

        this.searchInput.on("keyup", function(event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                this.searchBtn.trigger("click");
            }
        }.bind(this));

        this.searchBtn.on('click', function(e) {
            e.preventDefault();
            this.onFilterChangeCallback();
        }.bind(this))
    }


    /**
     * Filters the movies based on the current filter settings
     * @param {*} movies 
     * @returns filtered movies array
     */
    this.filter = function(movies) {
        var categoryId = this.categoriesFilter.val();
        if (categoryId) {
            movies = movies.filter(function(movie) {
                return !!movie.medicineFields[categoryId]
            })
        }

        var searchText = this.searchInput.val().trim();
        if (searchText) {
            var searchExpression = new RegExp(searchText, 'gi')
            movies = movies.filter(function(movie) {
                return (movie.name && movie.name.match(searchExpression)) 
                        || (movie.description && movie.description.match(searchExpression))
            })
        }

        return movies
    }
}

/**
 * API helper simplifies the usage of the movies related api requests
 * 
 * @param {*} urls api endpoints list
 *      Ex:
 *        {
 *           movies: "/",      // used for getting the movies list
 *           movieInfo: "/",   // gets single movie info
 *           booking: "/",     // POST booking request
 *           rating: "/",    // POST rating request
 *        }
 */
function ApiHelper(urls) {

    this.getMovies = function() {
        return $.ajax({
            url: urls.movies,
            type: 'GET',
            cache: false
        })
    }

    /**
     * Gets movie details
     * @param {*} movieId 
     * @returns jqXHR instance
     */
    this.getMovieInfo = function(movieId) {
        var url = `${urls.movieInfo || ''}`;
        return $.ajax({
            url: url + '?docMovieId=' + movieId,
            type: 'GET',
            cache: false
        })
    }

    /**
     * Posts a request to book or unbook the movie
     * @param {*} movieId 
     * @param {*} book 
     * @returns 
     */
    this.toggleBookMovie = function(movieId, book) {
        var formData = new FormData();
        formData.append('video-id', movieId);
        formData.append('selected', book);

        return $.ajax({
            url: urls.booking,
            type: 'POST',
            cache: false,
            processData: false,
            contentType: false,
            data: formData
        })
    }

    this.saveRating = function(movieId, rating) {
        var formData = new FormData();
        formData.append('video-id', movieId);
        formData.append('rating', rating);

        return $.ajax({
            url: urls.rating,
            type: 'POST',
            cache: false,
            processData: false,
            contentType: false,
            data: formData
        })
    }
}


/**
 * Utils for managing video thumbnails
 */
var MovieThumbnailUtils = MovieThumbnailUtils || {}

MovieThumbnailUtils.refreshThumbnailState = function(jqThumbnailElem, movie) {
    jqThumbnailElem.attr('data-video-src', movie.url);
    var posterImage = jqThumbnailElem.find('.poster-image');
    posterImage.attr(
        'src', 
        movie.thumbnail || MovieDefaults.POSTER_THUMBNAIL
    )
    posterImage.attr('alt', movie.name);
    jqThumbnailElem.find('.video-title').text(movie.name);
    jqThumbnailElem.attr('data-id', movie.id);
    jqThumbnailElem.find('.btn-like').toggleClass('active', movie.rating == MovieRating.LIKE);
    jqThumbnailElem.find('.btn-dislike').toggleClass('active', movie.rating == MovieRating.DISLIKE);

    jqThumbnailElem.find('.btn-book').toggleClass('d-none', movie.booked)
    jqThumbnailElem.find('.btn-unbook').toggleClass('d-none', !movie.booked)
}

/**
 * Finds the movie thumbnail by id and refreshes it's state
 * @param {Object} movie 
 */
MovieThumbnailUtils.refreshMovieThumbnail = function(movie) {
    if (movie) {
        var thumbnail = $(`.video-thumbnail[data-id=${movie.id}]`);
        MovieThumbnailUtils.refreshThumbnailState(thumbnail, movie);
    }
}


/**
 * Used for managing the movies info modal
 * 
 * @param {string} modalId 
 */
function MovieInformationModal(modalId) {
    this._modalInstance = bootstrap.Modal.getOrCreateInstance(document.getElementById(modalId))

    this.show = function(movie) {
        this.hide();
        var jqModalElem = $(`#${modalId}`);
        var thumbnailElem = jqModalElem.find(".video-thumbnail");
        MovieThumbnailUtils.refreshThumbnailState(thumbnailElem, movie);
        jqModalElem.find('.video-description').text(movie.description);
        jqModalElem.find('.video-title').text(movie.name)

        var playerElem = jqModalElem.find('.video-player');
        if (playerElem) {
            playerElem.attr('src', movie.url);
            playerElem[0].play();
            playerElem[0].focus();
        
            jqModalElem.one('hidden.bs.modal', function (event) { 
                playerElem[0].pause();
                playerElem[0].currentTime = 0;
            });
        }

        this._modalInstance.show();
    }

    this.hide = function() {
        this._modalInstance.hide();
    }
}

/**
 * Manages booked movies block with a fancy horizontal carousel
 * @param {*} selector 
 */
function BookedMoviesController(selector) {
    this._rootScreenContainer = $(selector);
    this._renderDesktop = true;
    this.layoutChangeCallback = function() {};

    this.init = function(layoutChangeCallback) {
        this.layoutChangeCallback = layoutChangeCallback || this.layoutChangeCallback;
        this._renderDesktop = this._isDesktop();
        window.addEventListener('resize', function() {
            var newLayout = this._isDesktop();
            if (this._renderDesktop != newLayout) {
                this._renderDesktop = newLayout;
                this.layoutChangeCallback();
                console.log('screen size changed to: ', this._renderDesktop)
            }
        }.bind(this))
    }

    this._isDesktop = function() {
        return window.matchMedia('(min-width: 993px)').matches
    }

    this.renderMovieThumbnails = function(movies) {
        $('.side-booked-videos-list').empty();
        $('.booked-movies-list-container').addClass('d-none');

        if (movies.length >= 1) {
            this._renderMovieThumbnails(movies);
            this._showBookedMovieScreen('booked-movies-list-screen');
        } else {
            this._showBookedMovieScreen('no-booked-movies-block');
        }
    }

    this._renderMovieThumbnails = function(movies) {
        if (movies.length == 1) {
            this._renderSingleThumbnail(movies[0]);
        } else if (this._renderDesktop) {
            this._renderDesktopCarousel(movies);
        } else {
            this._renderMobileCarousel(movies);
        }
    }

    this._renderSingleThumbnail = function(movie) {
        this._cleanupAllThumbnails();

        var jqMovieContainerTemplate = $('.movie-block-template');
        
        var jqMovieContainer = $(
            `
                <div class="row justify-content-center">
                    <div class="col-xl-8 col-lg-12 pb-xl-0">
                        ${jqMovieContainerTemplate.html()}
                    </div>
                </div>
            `
        );
        var jqThumbnailElem = jqMovieContainer.find('.video-thumbnail');
        jqThumbnailElem.addClass('large');
        MovieThumbnailUtils.refreshThumbnailState(jqThumbnailElem, movie);
        this._rootScreenContainer.append(jqMovieContainer);
    }

    this._cleanupAllThumbnails = function() {
        this._rootScreenContainer.find('.booked-movies-carousel').slick('unslick');
        this._rootScreenContainer.empty();
    }

    this._renderDesktopCarousel = function(movies) {
        this._cleanupAllThumbnails();

        var jqCarouselContainer = $(
            `
                <div class="booked-movies-carousel"></div>
            `
        );

        this._rootScreenContainer.append(jqCarouselContainer);
        var jqMovieContainerTemplate = $('.movie-block-template');

        var lastCarouselSlide = false;

        movies.forEach(function(movie, index) {
            if (!lastCarouselSlide || index % 2 != 0) {
                lastCarouselSlide = $(`<div class="movie-slide"></div>`);
                lastCarouselSlide.toggleClass('large', index == 0)
                jqCarouselContainer.append(lastCarouselSlide)
            }

            var jqThumbnailContainer = $(
                `
                    <div class="${index % 2 != 0 ? 'mb-3' : ''}">
                        ${jqMovieContainerTemplate.html()}
                    </div>
                `
            );
            var jqThumbnailElem = jqThumbnailContainer.find('.video-thumbnail');
            
            jqThumbnailElem.toggleClass('large', index == 0);
            MovieThumbnailUtils.refreshThumbnailState(jqThumbnailElem, movie);

            lastCarouselSlide.append(jqThumbnailContainer)
        });

        jqCarouselContainer.slick({
            infinite: false,
            variableWidth: true,
            appendArrows: false,
            slidesToShow: 1,
        });
    }

    this._renderMobileCarousel = function(movies) {
        this._cleanupAllThumbnails();

        var jqCarouselContainer = $(
            `
                <div class="booked-movies-carousel"></div>
            `
        );

        this._rootScreenContainer.append(jqCarouselContainer);
        var jqMovieContainerTemplate = $('.movie-block-template');

        movies.forEach(function(movie) {
            var jqMovieContainer = $(
                `
                    <div class="movie-slide">
                        <div>
                            ${jqMovieContainerTemplate.html()}
                        </div>
                    </div>
                `
            );
            var jqThumbnailElem = jqMovieContainer.find('.video-thumbnail');
            MovieThumbnailUtils.refreshThumbnailState(jqThumbnailElem, movie);
            jqCarouselContainer.append(jqMovieContainer)
        });

        jqCarouselContainer.slick({
            infinite: false,
            variableWidth: true,
            appendArrows: false,
            slidesToShow: 1,
        });
    }

    this._showBookedMovieScreen = function(selector) {
        $('.booked-movie-screen').addClass('d-none');
        $(`.${selector}`).removeClass('d-none');
    }

    this._renderLargeBookedMovieBlock = function(movie) {
        var movieContainer = $('.large-booked-movie-container');
        var jqThumbnailElem = movieContainer.find('.video-thumbnail');
        MovieThumbnailUtils.refreshThumbnailState(jqThumbnailElem, movie);
    }

    this._renderSmallBookedMovieBlock = function(movie) {
        $('.booked-movies-list-container').removeClass('d-none');

        var movieContainer = $($('.video-thumbnail-template').html());
        var jqThumbnailElem = movieContainer.find('.video-thumbnail');
        MovieThumbnailUtils.refreshThumbnailState(jqThumbnailElem, movie);
        
        $('.booked-movies-list-container').find('.side-booked-videos-list').append(movieContainer);
    }
}


/**
 * This controller dispatches like/dislike/info and book/unbook actions for standalone video thumbnails.
 * @param {Object} options - controller settings:
 *      ex:
 *             {
 *                  dispatchers: {
 *                      bookMovie: function(movieId, function(movieData) {}) {},
 *                      unbookMovie: function(movieId, function(movieData) {}) {},
 *                      toggleRating: function(movieId, rating, function(movieData) {}) {},
 *                      getMovieInfo: function(movieId, function(movieData) {}) {},
 *                  }
 *             }
 */
function MovieThumbnailController(options) {
    this._dispatchers = {
        bookMovie: options.dispatchers.bookMovie || function(movieId, callback) { callback(false); },
        unbookMovie: options.dispatchers.unbookMovie || function(movieId, callback) { callback(false); },
        toggleRating: options.dispatchers.toggleRating || function(movieId, rating, callback) { callback(false); },
        getMovieInfo: options.dispatchers.getMovieInfo || function(movieId, callback) { callback(false); },
    }

    this._movieInfoModal = new MovieInformationModal('movie-information-modal');

    this.init = function() {
        this._setupEventHandlers();
    }

    this._setupEventHandlers = function() {
        $(document).on('click', '.btn-book', this._handleClickBookMovie.bind(this));
        $(document).on('click', '.btn-unbook', this._handleClickUnbookMovie.bind(this));
        $(document).on('click', '.btn-like', this._handleClickLikeMovie.bind(this));
        $(document).on('click', '.btn-dislike', this._handleClickDislikeMovie.bind(this));
        $(document).on('click', '.btn-show-info, .video-thumbnail .play-button-container', this._handleClickShowInfo.bind(this));
    }

    this._handleClickBookMovie = function(e) {
        e.preventDefault();
        var movieId = this._detectMovieIdByEvent(e);
        this._dispatchers.bookMovie(movieId, function(movieData) {
            MovieThumbnailUtils.refreshMovieThumbnail(movieData);
        })
    }

    this._handleClickUnbookMovie = function(e) {
        e.preventDefault();
        var movieId = this._detectMovieIdByEvent(e);
        this._dispatchers.unbookMovie(movieId, function(movieData) {
            MovieThumbnailUtils.refreshMovieThumbnail(movieData);
        })
    }

    this._handleClickLikeMovie = function(e) {
        e.preventDefault();
        var movieId = this._detectMovieIdByEvent(e);
        var liked = $(e.target).hasClass('active');
        this._dispatchers.toggleRating(movieId, liked ? null : MovieRating.LIKE, function(movieData) {
            MovieThumbnailUtils.refreshMovieThumbnail(movieData);
        })
    }

    this._handleClickDislikeMovie = function(e) {
        e.preventDefault();
        var movieId = this._detectMovieIdByEvent(e);
        var disliked = $(e.target).hasClass('active');
        this._dispatchers.toggleRating(movieId, disliked ? null : MovieRating.DISLIKE, function(movieData) {
            MovieThumbnailUtils.refreshMovieThumbnail(movieData);
        })
    }

    this._handleClickShowInfo = function(e) {
        e.preventDefault();
        var movieId = this._detectMovieIdByEvent(e);
        this._dispatchers.getMovieInfo(movieId, function(movieData) {
            if (movieData) {
                this._movieInfoModal.show(movieData);
            }
        }.bind(this))
    }

    this._detectMovieIdByEvent = function(e) {
        var videoThumbnail = $(e.target).closest('.video-thumbnail');
        var movieId = videoThumbnail.attr('data-id');
        if (!movieId) {
            console.error('video thumbnail should have id. what is going on?')
            return false;
        }
        return movieId;
    }
}

/**
 * Used for managing video thumbnails on the pages without filter bar
 * @param {Object} options 
 *  Ex:
 *     {
 *          api: { // See ApiHelper description
 *              movies: "/",      // used for getting the movies list
 *              movieInfo: "/",   // gets single movie info
 *              booking: "/",     // POST booking request
 *              rating: "/",      // POST rating request
 *          }
 *     }
 */
function DefaultMovieThumbnailController(options) {
    this._apiHelper = new ApiHelper(options.api || {});
    this._movieThumbnailController = false;

    this.init = function() {
        this._movieThumbnailController = new MovieThumbnailController(
            {
                dispatchers: {
                    bookMovie: function(movieId, callback) {
                        this._apiHelper.toggleBookMovie(movieId, true)
                            .done(function(data) {
                                callback(data);
                            }.bind(this))
                            .fail(function(e) {
                                console.error("Can't post book request:", e.statusText);
                                callback(false, e);
                            })
                    }.bind(this),
                    unbookMovie: function(movieId, callback) {
                        this._apiHelper.toggleBookMovie(movieId, false)
                            .done(function(movieData) {
                                callback(movieData);
                            }.bind(this))
                            .fail(function(e) {
                                console.error("Can't post book request:", e.statusText);
                                callback(false, e);
                            })
                    }.bind(this),
                    toggleRating: function(movieId, rating, callback) {
                        this._apiHelper.saveRating(movieId, rating)
                            .done(function(movieData) {
                                callback(movieData);
                            }.bind(this))
                            .fail(function(e) {
                                console.error("Can't post rating request:", e.statusText);
                                callback(false, e);
                            })
                    }.bind(this),
                    getMovieInfo: function(movieId, callback) {
                        this._apiHelper.getMovieInfo(movieId)
                        .done(function(movieData) {
                            callback(movieData);
                        }.bind(this))
                        .fail(function(e) {
                            console.error("Can't get movie info:", e.statusText);
                            callback(false, e);
                        })
                    }.bind(this),
                }
            }
        );

        this._movieThumbnailController.init();
    }

}
