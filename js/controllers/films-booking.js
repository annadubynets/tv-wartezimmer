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

function FilmsBookingController(options) {
    this.api = options.api || {};
    this.bookedMovies = [];
    this.availableMovies = [];
    this.medicineFields = [];
    
    this.defaultPosterImage = 'images/video.png';

    this.init = function() {
        this._fetchInitialData({
            success: function() { 
                this._initPagination()
                this._renderManageScreen() 
            }.bind(this),
            error: function(error) { this._showError(error) }.bind(this)
        });
    }

    /**
     * Gets initial data with the all films and categories
     */
    this._fetchInitialData = function(callbacks) {
        $.get(this.api.movies, function(data) {
            console.log(data);

            for (var id in data.docMovies){
                if (data.docMovies.hasOwnProperty(id)) {
                    var film = data.docMovies[id]
                    if (film.booked) {
                        this.bookedMovies.push(film);
                    } else {
                        this.availableMovies.push(film);
                    }
                }
            }

            for (var id in data.medicineFields){
                if (data.medicineFields.hasOwnProperty(id)) {
                    this.medicineFields.push(data.medicineFields[id]);
                }
            }

            console.debug('Booked: ', this.bookedMovies.length);
            console.debug('Available: ', this.availableMovies.length);
            console.debug('Categories: ', this.medicineFields.length);

            callbacks.success();
        }.bind(this)).fail(function(e) {
            console.error("Can't fetch data:", e.statusText)
            callbacks.error(e.statusText);
        });
    }

    this._initPagination = function() {
        this.availableMoviesPagination = new PaginationController(
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



    this._renderBookedMovies = function() {
        $('.side-booked-videos-list').empty();
        $('.booked-movies-list-container').addClass('d-none');

        if (this.bookedMovies.length > 0) {
            this.bookedMovies.forEach(function(movie, index) {
                if (index == 0) {
                    this._renderLargeBookedMovieBlock(movie);
                } else {
                    this._renderSmallBookedMovieBlock(movie);
                }
            }.bind(this));

            this._showBookedMovieScreen('booked-movies-list');
        } else {
            this._showBookedMovieScreen('no-booked-movies-block');
        }
    }

    this._renderLargeBookedMovieBlock = function(movie) {
        var movieContainer = $('.large-booked-movie-container');
        var jqThumbnailElem = movieContainer.find('.video-thumbnail');
        this._fillMovieThumbnail(jqThumbnailElem, movie);
    }

    this._fillMovieThumbnail = function(jqThumbnailElem, movie) {
        jqThumbnailElem.attr('data-video-src', movie.url);
        var posterImage = jqThumbnailElem.find('.poster-image');
        posterImage.attr(
            'src', 
            movie.thumbnails.length > 0 ? movie.thumbnails[movie.thumbnails.length-1] : this.defaultPosterImage
        )
        posterImage.attr('alt', movie.name);
        jqThumbnailElem.find('.video-title').text(movie.name);
        jqThumbnailElem.attr('id', movie.id);
    }

    this._renderSmallBookedMovieBlock = function(movie) {
        $('.booked-movies-list-container').removeClass('d-none');

        var movieContainer = $($('.video-thumbnail-template').html());
        var jqThumbnailElem = movieContainer.find('.video-thumbnail');
        this._fillMovieThumbnail(jqThumbnailElem, movie);
        
        $('.booked-movies-list-container').find('.side-booked-videos-list').append(movieContainer);
    }

    this._showBookedMovieScreen = function(selector) {
        $('.booked-movie-screen').addClass('d-none');
        $(`.${selector}`).removeClass('d-none');
    }



    this._renderAvailableMovies = function() {
        var movies = this._getAvailableMovies();
        var jqRootMoviesContainer = $('.available-movies-list-container');
        jqRootMoviesContainer.find('.available-movie-container').remove();
        jqRootMoviesContainer.find('.no-available-movies-block').toggleClass('d-none', !!movies.length)
        var jqMovieContainerTemplate = $('.available-movies .video-thumbnail-template');
        movies.forEach(function(movie) {

            var jqMovieContainer = $(jqMovieContainerTemplate.html());
            var jqThumbnailElem = jqMovieContainer.find('.video-thumbnail');
            this._fillMovieThumbnail(jqThumbnailElem, movie);
            
            jqRootMoviesContainer.append(jqMovieContainer);
        }.bind(this))
    }

    this._getAvailableMovies = function() {
        var movies = this._getFilteredAvailableMovies();
        return this._applyPagination(movies);
    }

    this._getFilteredAvailableMovies = function() {
        return this.availableMovies;
    }

    this._applyPagination = function(movies) {
        this.availableMoviesPagination.setup(movies.length);
        var startIndex = this.availableMoviesPagination.currentPage * this.availableMoviesPagination.itemsPerPage;
        return movies.slice(
            startIndex,
            startIndex + this.availableMoviesPagination.itemsPerPage
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
        if (pageNumber < 0) {
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