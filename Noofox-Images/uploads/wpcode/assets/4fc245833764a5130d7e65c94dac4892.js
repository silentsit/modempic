jQuery(document).ready(function($) {
    // Create a container for the promotional message
    var promoContainer = $('<div class="promotional-message"></div>');
    $('.single_variation_wrap').after(promoContainer);

    // Update the promotional message when a variation is selected
    $('.variations_form').on('found_variation', function(event, variation) {
        if (variation.promotional_message) {
            promoContainer.html(variation.promotional_message);
        } else {
            promoContainer.html(''); // Clear message if no promotion
        }
    });

    $('.variations_form').on('reset_data', function() {
        promoContainer.html(''); // Clear message on reset
    });
});
