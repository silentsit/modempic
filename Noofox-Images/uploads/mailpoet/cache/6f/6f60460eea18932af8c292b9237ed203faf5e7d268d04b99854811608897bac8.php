<?php

use MailPoetVendor\Twig\Environment;
use MailPoetVendor\Twig\Error\LoaderError;
use MailPoetVendor\Twig\Error\RuntimeError;
use MailPoetVendor\Twig\Extension\SandboxExtension;
use MailPoetVendor\Twig\Markup;
use MailPoetVendor\Twig\Sandbox\SecurityError;
use MailPoetVendor\Twig\Sandbox\SecurityNotAllowedTagError;
use MailPoetVendor\Twig\Sandbox\SecurityNotAllowedFilterError;
use MailPoetVendor\Twig\Sandbox\SecurityNotAllowedFunctionError;
use MailPoetVendor\Twig\Source;
use MailPoetVendor\Twig\Template;

/* newsletter/editor.html */
class __TwigTemplate_c4050b0eab36162988b687d42a142f7a778acf5582795f9a2fdb7fab836e0cc2 extends \MailPoetVendor\Twig\Template
{
    private $source;
    private $macros = [];

    public function __construct(Environment $env)
    {
        parent::__construct($env);

        $this->source = $this->getSourceContext();

        $this->blocks = [
            'templates' => [$this, 'block_templates'],
            'content' => [$this, 'block_content'],
            'translations' => [$this, 'block_translations'],
            'after_css' => [$this, 'block_after_css'],
            'after_javascript' => [$this, 'block_after_javascript'],
        ];
    }

    protected function doGetParent(array $context)
    {
        // line 1
        return "layout.html";
    }

    protected function doDisplay(array $context, array $blocks = [])
    {
        $macros = $this->macros;
        $this->parent = $this->loadTemplate("layout.html", "newsletter/editor.html", 1);
        $this->parent->display($context, array_merge($this->blocks, $blocks));
    }

    // line 3
    public function block_templates($context, array $blocks = [])
    {
        $macros = $this->macros;
        // line 4
        echo "  ";
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_tools_generic", "newsletter/templates/blocks/base/toolsGeneric.hbs");
        // line 7
        echo "
  ";
        // line 8
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_automated_latest_content_block", "newsletter/templates/blocks/automatedLatestContent/block.hbs");
        // line 11
        echo "
  ";
        // line 12
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_automated_latest_content_widget", "newsletter/templates/blocks/automatedLatestContent/widget.hbs");
        // line 15
        echo "
  ";
        // line 16
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_automated_latest_content_settings", "newsletter/templates/blocks/automatedLatestContent/settings.hbs");
        // line 19
        echo "
  ";
        // line 20
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_automated_latest_content_layout_block", "newsletter/templates/blocks/automatedLatestContentLayout/block.hbs");
        // line 23
        echo "
  ";
        // line 24
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_automated_latest_content_layout_widget", "newsletter/templates/blocks/automatedLatestContentLayout/widget.hbs");
        // line 27
        echo "
  ";
        // line 28
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_automated_latest_content_layout_settings", "newsletter/templates/blocks/automatedLatestContentLayout/settings.hbs");
        // line 31
        echo "
  ";
        // line 32
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_button_block", "newsletter/templates/blocks/button/block.hbs");
        // line 35
        echo "
  ";
        // line 36
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_button_widget", "newsletter/templates/blocks/button/widget.hbs");
        // line 39
        echo "
  ";
        // line 40
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_button_settings", "newsletter/templates/blocks/button/settings.hbs");
        // line 43
        echo "
  ";
        // line 44
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_container_block", "newsletter/templates/blocks/container/block.hbs");
        // line 47
        echo "
  ";
        // line 48
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_container_block_empty", "newsletter/templates/blocks/container/emptyBlock.hbs");
        // line 51
        echo "
  ";
        // line 52
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_container_one_column_widget", "newsletter/templates/blocks/container/oneColumnLayoutWidget.hbs");
        // line 55
        echo "
  ";
        // line 56
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_container_two_column_widget", "newsletter/templates/blocks/container/twoColumnLayoutWidget.hbs");
        // line 59
        echo "
  ";
        // line 60
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_container_two_column_12_widget", "newsletter/templates/blocks/container/twoColumnLayoutWidget12.hbs");
        // line 63
        echo "
  ";
        // line 64
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_container_two_column_21_widget", "newsletter/templates/blocks/container/twoColumnLayoutWidget21.hbs");
        // line 67
        echo "
  ";
        // line 68
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_container_three_column_widget", "newsletter/templates/blocks/container/threeColumnLayoutWidget.hbs");
        // line 71
        echo "
  ";
        // line 72
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_container_settings", "newsletter/templates/blocks/container/settings.hbs");
        // line 75
        echo "
  ";
        // line 76
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_container_column_settings", "newsletter/templates/blocks/container/columnSettings.hbs");
        // line 79
        echo "
  ";
        // line 80
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_divider_block", "newsletter/templates/blocks/divider/block.hbs");
        // line 83
        echo "
  ";
        // line 84
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_divider_widget", "newsletter/templates/blocks/divider/widget.hbs");
        // line 87
        echo "
  ";
        // line 88
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_divider_settings", "newsletter/templates/blocks/divider/settings.hbs");
        // line 91
        echo "
  ";
        // line 92
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_footer_block", "newsletter/templates/blocks/footer/block.hbs");
        // line 95
        echo "
  ";
        // line 96
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_footer_widget", "newsletter/templates/blocks/footer/widget.hbs");
        // line 99
        echo "
  ";
        // line 100
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_footer_settings", "newsletter/templates/blocks/footer/settings.hbs");
        // line 103
        echo "
  ";
        // line 104
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_header_block", "newsletter/templates/blocks/header/block.hbs");
        // line 107
        echo "
  ";
        // line 108
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_header_widget", "newsletter/templates/blocks/header/widget.hbs");
        // line 111
        echo "
  ";
        // line 112
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_header_settings", "newsletter/templates/blocks/header/settings.hbs");
        // line 115
        echo "
  ";
        // line 116
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_image_block", "newsletter/templates/blocks/image/block.hbs");
        // line 119
        echo "
  ";
        // line 120
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_image_widget", "newsletter/templates/blocks/image/widget.hbs");
        // line 123
        echo "
  ";
        // line 124
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_image_settings", "newsletter/templates/blocks/image/settings.hbs");
        // line 127
        echo "
  ";
        // line 128
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_posts_block", "newsletter/templates/blocks/posts/block.hbs");
        // line 131
        echo "
  ";
        // line 132
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_posts_widget", "newsletter/templates/blocks/posts/widget.hbs");
        // line 135
        echo "
  ";
        // line 136
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_posts_settings", "newsletter/templates/blocks/posts/settings.hbs");
        // line 139
        echo "
  ";
        // line 140
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_posts_settings_display_options", "newsletter/templates/blocks/posts/settingsDisplayOptions.hbs");
        // line 143
        echo "
  ";
        // line 144
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_posts_settings_selection", "newsletter/templates/blocks/posts/settingsSelection.hbs");
        // line 147
        echo "
  ";
        // line 148
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_posts_settings_selection_empty", "newsletter/templates/blocks/posts/settingsSelectionEmpty.hbs");
        // line 151
        echo "
  ";
        // line 152
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_posts_settings_single_post", "newsletter/templates/blocks/posts/settingsSinglePost.hbs");
        // line 155
        echo "
  ";
        // line 156
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_products_block", "newsletter/templates/blocks/products/block.hbs");
        // line 159
        echo "
  ";
        // line 160
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_products_widget", "newsletter/templates/blocks/products/widget.hbs");
        // line 163
        echo "
  ";
        // line 164
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_products_settings", "newsletter/templates/blocks/products/settings.hbs");
        // line 167
        echo "
  ";
        // line 168
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_products_settings_display_options", "newsletter/templates/blocks/products/settingsDisplayOptions.hbs");
        // line 171
        echo "
  ";
        // line 172
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_products_settings_selection", "newsletter/templates/blocks/products/settingsSelection.hbs");
        // line 175
        echo "
  ";
        // line 176
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_products_settings_selection_empty", "newsletter/templates/blocks/products/settingsSelectionEmpty.hbs");
        // line 179
        echo "
  ";
        // line 180
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_products_settings_single_post", "newsletter/templates/blocks/products/settingsSinglePost.hbs");
        // line 183
        echo "
  ";
        // line 184
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_acc_block", "newsletter/templates/blocks/abandonedCartContent/block.hbs");
        // line 187
        echo "
  ";
        // line 188
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_acc_widget", "newsletter/templates/blocks/abandonedCartContent/widget.hbs");
        // line 191
        echo "
  ";
        // line 192
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_acc_settings", "newsletter/templates/blocks/abandonedCartContent/settings.hbs");
        // line 195
        echo "
  ";
        // line 196
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_acc_settings_display_options", "newsletter/templates/blocks/abandonedCartContent/settingsDisplayOptions.hbs");
        // line 199
        echo "
  ";
        // line 200
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_social_block", "newsletter/templates/blocks/social/block.hbs");
        // line 203
        echo "
  ";
        // line 204
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_social_block_icon", "newsletter/templates/blocks/social/blockIcon.hbs");
        // line 207
        echo "
  ";
        // line 208
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_social_widget", "newsletter/templates/blocks/social/widget.hbs");
        // line 211
        echo "
  ";
        // line 212
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_social_settings", "newsletter/templates/blocks/social/settings.hbs");
        // line 215
        echo "
  ";
        // line 216
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_social_settings_icon", "newsletter/templates/blocks/social/settingsIcon.hbs");
        // line 219
        echo "
  ";
        // line 220
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_social_settings_icon_selector", "newsletter/templates/blocks/social/settingsIconSelector.hbs");
        // line 223
        echo "
  ";
        // line 224
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_social_settings_styles", "newsletter/templates/blocks/social/settingsStyles.hbs");
        // line 227
        echo "
  ";
        // line 228
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_spacer_block", "newsletter/templates/blocks/spacer/block.hbs");
        // line 231
        echo "
  ";
        // line 232
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_spacer_widget", "newsletter/templates/blocks/spacer/widget.hbs");
        // line 235
        echo "
  ";
        // line 236
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_spacer_settings", "newsletter/templates/blocks/spacer/settings.hbs");
        // line 239
        echo "
  ";
        // line 240
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_text_block", "newsletter/templates/blocks/text/block.hbs");
        // line 243
        echo "
  ";
        // line 244
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_text_widget", "newsletter/templates/blocks/text/widget.hbs");
        // line 247
        echo "
  ";
        // line 248
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_text_settings", "newsletter/templates/blocks/text/settings.hbs");
        // line 251
        echo "
  ";
        // line 252
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_heading", "newsletter/templates/components/heading.hbs");
        // line 255
        echo "
  ";
        // line 256
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_history", "newsletter/templates/components/history.hbs");
        // line 259
        echo "
  ";
        // line 260
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_save", "newsletter/templates/components/save.hbs");
        // line 263
        echo "
  ";
        // line 264
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_styles", "newsletter/templates/components/styles.hbs");
        // line 267
        echo "
  ";
        // line 268
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_newsletter_preview", "newsletter/templates/components/newsletterPreview.hbs");
        // line 271
        echo "
  ";
        // line 272
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_sidebar", "newsletter/templates/components/sidebar/sidebar.hbs");
        // line 275
        echo "
  ";
        // line 276
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_sidebar_content", "newsletter/templates/components/sidebar/content.hbs");
        // line 279
        echo "
  ";
        // line 280
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_sidebar_layout", "newsletter/templates/components/sidebar/layout.hbs");
        // line 283
        echo "
  ";
        // line 284
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_sidebar_styles", "newsletter/templates/components/sidebar/styles.hbs");
        // line 287
        echo "
  ";
        // line 288
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_woocommerce_new_account_content", "newsletter/templates/blocks/woocommerceContent/new_account.hbs");
        // line 291
        echo "
  ";
        // line 292
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_woocommerce_processing_order_content", "newsletter/templates/blocks/woocommerceContent/processing_order.hbs");
        // line 295
        echo "
  ";
        // line 296
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_woocommerce_completed_order_content", "newsletter/templates/blocks/woocommerceContent/completed_order.hbs");
        // line 299
        echo "
  ";
        // line 300
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_woocommerce_customer_note_content", "newsletter/templates/blocks/woocommerceContent/customer_note.hbs");
        // line 303
        echo "
  ";
        // line 304
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_woocommerce_content_widget", "newsletter/templates/blocks/woocommerceContent/widget.hbs");
        // line 307
        echo "
  ";
        // line 308
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_woocommerce_heading_block", "newsletter/templates/blocks/woocommerceHeading/block.hbs");
        // line 311
        echo "
  ";
        // line 312
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_woocommerce_heading_widget", "newsletter/templates/blocks/woocommerceHeading/widget.hbs");
        // line 315
        echo "
  ";
        // line 316
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_unknown_block_fallback_block", "newsletter/templates/blocks/unknownBlockFallback/block.hbs");
        // line 319
        echo "
  ";
        // line 320
        echo $this->extensions['MailPoet\Twig\Handlebars']->generatePartial($this->env, $context, "newsletter_editor_template_unknown_block_fallback_widget", "newsletter/templates/blocks/unknownBlockFallback/widget.hbs");
        // line 323
        echo "
";
    }

    // line 326
    public function block_content($context, array $blocks = [])
    {
        $macros = $this->macros;
        // line 327
        echo "<!-- Hidden heading for notices to appear under -->
<h1 style=\"display:none\">";
        // line 328
        echo $this->extensions['MailPoet\Twig\I18n']->translate("Newsletter Editor");
        echo "</h1>
<div id=\"mailpoet_editor\">
  <div id=\"mailpoet_editor_steps_heading\"></div>
  <div class=\"clearfix\"></div>
  <div id=\"mailpoet_editor_heading_left\">
    <div id=\"mailpoet_editor_heading\"></div>
  </div>
  <div id=\"mailpoet_editor_heading_right\">
    <div id=\"mailpoet_editor_top\"></div>
  </div>
  <div class=\"clearfix\"></div>
  <div id=\"mailpoet_editor_main_wrapper\">
    <div id=\"mailpoet_editor_styles\"></div>
    <div id=\"mailpoet_editor_content_container\">
      <div class=\"mailpoet_newsletter_wrapper\">
        <div id=\"mailpoet_editor_content\"></div>
      </div>
    </div>
    <div id=\"mailpoet_editor_sidebar\"></div>
    <div class=\"clear\"></div>
  </div>
  <div id=\"mailpoet_editor_bottom\"></div>

  <div class=\"mailpoet_layer_overlay\" style=\"display:none;\"></div>
</div>
";
        // line 353
        if (($context["is_wc_transactional_email"] ?? null)) {
            // line 354
            echo "  <script type=\"text/javascript\">
    var mailpoet_beacon_articles = [
      '5de8c5cd2c7d3a7e9ae4c15f',
    ];
  </script>
";
        }
    }

    // line 362
    public function block_translations($context, array $blocks = [])
    {
        $macros = $this->macros;
        // line 363
        echo "  ";
        echo $this->extensions['MailPoet\Twig\I18n']->localize(["stepNameTypeStandard" => $this->extensions['MailPoet\Twig\I18n']->translate("Newsletter"), "stepNameTypeWelcome" => $this->extensions['MailPoet\Twig\I18n']->translate("Welcome Email"), "stepNameTypeNotification" => $this->extensions['MailPoet\Twig\I18n']->translate("Post Notification"), "stepNameTypeWooCommerce" => $this->extensions['MailPoet\Twig\I18n']->translate("WooCommerce"), "stepNameTypeReEngagement" => $this->extensions['MailPoet\Twig\I18n']->translate("Re-engagement"), "stepNameTemplate" => $this->extensions['MailPoet\Twig\I18n']->translate("Template"), "stepNameDesign" => $this->extensions['MailPoet\Twig\I18n']->translate("Design"), "stepNameSend" => $this->extensions['MailPoet\Twig\I18n']->translate("Send"), "stepNameActivate" => $this->extensions['MailPoet\Twig\I18n']->translate("Activate"), "close" => $this->extensions['MailPoet\Twig\I18n']->translate("Close"), "failedToFetchAvailablePosts" => $this->extensions['MailPoet\Twig\I18n']->translate("Failed to fetch available posts"), "failedToFetchRenderedPosts" => $this->extensions['MailPoet\Twig\I18n']->translate("Failed to fetch rendered posts"), "shortcodesWindowTitle" => $this->extensions['MailPoet\Twig\I18n']->translate("Select a shortcode"), "newsletterSavingError" => $this->extensions['MailPoet\Twig\I18n']->translate("The email could not be saved. Please, clear browser cache and reload the page. If the problem persists, duplicate the email and try again."), "unsubscribeLinkMissing" => $this->extensions['MailPoet\Twig\I18n']->translate("All emails must include an \"Unsubscribe\" link. Add a footer widget to your email to continue."), "reEngageLinkMissing" => $this->extensions['MailPoet\Twig\I18n']->translate("A re-engagement email must include a link with [link:subscription_re_engage_url] shortcode."), "newsletterIsEmpty" => $this->extensions['MailPoet\Twig\I18n']->translate("Poet, please add prose to your masterpiece before you send it to your followers."), "emailAlreadySent" => $this->extensions['MailPoet\Twig\I18n']->translate("This email has already been sent. It can be edited, but not sent again. Duplicate this email if you want to send it again."), "automatedLatestContentMissing" => $this->extensions['MailPoet\Twig\I18n']->translateWithContext("Please add an “Automatic Latest Content” widget to the email from the right sidebar.", "(Please reuse the current translation used for the string “Automatic Latest Content”) This Error message is displayed when a user tries to send a “Post Notification” email without any “Automatic Latest Content” widget inside"), "newsletterPreviewEmailMissing" => $this->extensions['MailPoet\Twig\I18n']->translate("Enter an email address to send the preview newsletter to."), "newsletterPreviewError" => $this->extensions['MailPoet\Twig\I18n']->translate("Sorry, there was an error, please try again later."), "newsletterPreviewErrorNotice" => $this->extensions['MailPoet\Twig\I18n']->translate("The email could not be sent due to a technical issue with %1\$s"), "newsletterPreviewErrorCheckConfiguration" => $this->extensions['MailPoet\Twig\I18n']->translate("Please check your sending method configuration, you may need to consult with your hosting company."), "newsletterPreviewErrorUseSendingService" => $this->extensions['MailPoet\Twig\I18n']->translate("The easy alternative is to <b>send emails with MailPoet Sending Service</b> instead, like thousands of other users do."), "newsletterPreviewErrorSignUpForSendingService" => $this->extensions['MailPoet\Twig\I18n']->translate("Sign up for free in minutes"), "newsletterPreviewErrorCheckSettingsNotice" => $this->extensions['MailPoet\Twig\I18n']->translate("Check your [link]sending method settings[/link]."), "templateNameMissing" => $this->extensions['MailPoet\Twig\I18n']->translate("Please add a template name"), "helpTooltipDesignerSubjectLine" => $this->extensions['MailPoet\Twig\I18n']->translate("You can add MailPoet shortcodes here. For example, you can add your subscribers' first names by using this shortcode: [subscriber:firstname | default:reader]. Simply copy and paste the shortcode into the field."), "helpTooltipDesignerPreheader" => $this->extensions['MailPoet\Twig\I18n']->translate("This optional text will appear in your subscribers' inboxes, beside the subject line. Write something enticing!"), "helpTooltipDesignerPreheaderWarning" => $this->extensions['MailPoet\Twig\I18n']->translate("Max length is 250 characters, however, we recommend 80 characters."), "helpTooltipDesignerFullWidth" => $this->extensions['MailPoet\Twig\I18n']->translate("This option eliminates padding around the image."), "helpTooltipDesignerIdealWidth" => $this->extensions['MailPoet\Twig\I18n']->translate("Use images with widths of at least 1,000 pixels to ensure sharp display on high density screens, like mobile devices."), "templateSaved" => $this->extensions['MailPoet\Twig\I18n']->translate("Template has been saved."), "templateSaveFailed" => $this->extensions['MailPoet\Twig\I18n']->translate("Template has not been saved, please try again"), "categoriesAndTags" => $this->extensions['MailPoet\Twig\I18n']->translate("Categories & tags"), "noPostsToDisplay" => $this->extensions['MailPoet\Twig\I18n']->translate("There is no content to display."), "previewShouldOpenInNewTab" => $this->extensions['MailPoet\Twig\I18n']->translate("Your preview should open in a new tab. Please ensure your browser is not blocking popups from this page."), "newsletterPreview" => $this->extensions['MailPoet\Twig\I18n']->translate("Newsletter Preview"), "newsletterBodyIsCorrupted" => $this->extensions['MailPoet\Twig\I18n']->translate("Contents of this newsletter are corrupted and may be lost, you may need to add new content to this newsletter, or create a new one. If possible, please contact us and report this issue."), "saving" => $this->extensions['MailPoet\Twig\I18n']->translate("Saving..."), "unsavedChangesWillBeLost" => $this->extensions['MailPoet\Twig\I18n']->translate("There are unsaved changes which will be lost if you leave this page."), "selectColor" => $this->extensions['MailPoet\Twig\I18n']->translateWithContext("Select", "select color"), "cancelColorSelection" => $this->extensions['MailPoet\Twig\I18n']->translateWithContext("Cancel", "cancel color selection"), "newsletterIsPaused" => $this->extensions['MailPoet\Twig\I18n']->translate("Email sending has been paused."), "emailWasDeactivated" => $this->extensions['MailPoet\Twig\I18n']->translate("This email was deactivated."), "tutorialVideoTitle" => $this->extensions['MailPoet\Twig\I18n']->translate("Before you start, this is how you drag and drop in MailPoet"), "selectType" => $this->extensions['MailPoet\Twig\I18n']->translate("Select type"), "events" => $this->extensions['MailPoet\Twig\I18n']->translate("Events"), "conditions" => $this->extensions['MailPoet\Twig\I18n']->translateWithContext("Conditions", "Configuration options for automatic email events"), "template" => $this->extensions['MailPoet\Twig\I18n']->translate("Template"), "designer" => $this->extensions['MailPoet\Twig\I18n']->translate("Designer"), "send" => $this->extensions['MailPoet\Twig\I18n']->translate("Send"), "canUndo" => $this->extensions['MailPoet\Twig\I18n']->translateWithContext("Undo", "A button title when user can undo the change in editor", "mailpoet"), "canNotUndo" => $this->extensions['MailPoet\Twig\I18n']->translateWithContext("No actions available to undo.", "A button title when user can't undo the change in editor", "mailpoet"), "canRedo" => $this->extensions['MailPoet\Twig\I18n']->translateWithContext("Redo", "A button title when user can redo the change in editor", "mailpoet"), "canNotRedo" => $this->extensions['MailPoet\Twig\I18n']->translateWithContext("No actions available to redo.", "A button title when user can't redo the change in editor", "mailpoet")]);
        // line 421
        echo "
";
    }

    // line 424
    public function block_after_css($context, array $blocks = [])
    {
        $macros = $this->macros;
        // line 425
        echo "  ";
        echo $this->extensions['MailPoet\Twig\Assets']->generateStylesheet("mailpoet-editor.css");
        echo "
";
    }

    // line 428
    public function block_after_javascript($context, array $blocks = [])
    {
        $macros = $this->macros;
        // line 429
        echo "  ";
        echo $this->extensions['MailPoet\Twig\Assets']->generateJavascript("newsletter_editor.js");
        echo "

  ";
        // line 431
        echo do_action("mailpoet_newsletter_editor_after_javascript");
        echo "

  <script type=\"text/javascript\">
    function renderWithFont(node) {
      if (!node.element) return node.text;
      var \$wrapper = jQuery('<span></span>');
      \$wrapper.css({'font-family': Handlebars.helpers.fontWithFallback(node.element.value)});
      \$wrapper.text(node.text);
      return \$wrapper;
    }
    function fontsSelect(selector) {
      jQuery(selector).select2({
        minimumResultsForSearch: Infinity,
        templateSelection: renderWithFont,
        templateResult: renderWithFont
      });
    }

    var templates = {
      styles: Handlebars.compile(
        jQuery('#newsletter_editor_template_styles').html()
      ),
      save: Handlebars.compile(
        jQuery('#newsletter_editor_template_save').html()
      ),
      heading: Handlebars.compile(
        jQuery('#newsletter_editor_template_heading').html()
      ),
      history: Handlebars.compile(
        jQuery('#newsletter_editor_template_history').html()
      ),

      sidebar: Handlebars.compile(
        jQuery('#newsletter_editor_template_sidebar').html()
      ),
      sidebarContent: Handlebars.compile(
        jQuery('#newsletter_editor_template_sidebar_content').html()
      ),
      sidebarLayout: Handlebars.compile(
        jQuery('#newsletter_editor_template_sidebar_layout').html()
      ),
      sidebarStyles: Handlebars.compile(
        jQuery('#newsletter_editor_template_sidebar_styles').html()
      ),
      newsletterPreview: Handlebars.compile(
        jQuery('#newsletter_editor_template_newsletter_preview').html()
      ),

      genericBlockTools: Handlebars.compile(
        jQuery('#newsletter_editor_template_tools_generic').html()
      ),

      containerBlock: Handlebars.compile(
        jQuery('#newsletter_editor_template_container_block').html()
      ),
      containerEmpty: Handlebars.compile(
        jQuery('#newsletter_editor_template_container_block_empty').html()
      ),
      oneColumnLayoutInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_container_one_column_widget').html()
      ),
      twoColumnLayoutInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_container_two_column_widget').html()
      ),
      twoColumn12LayoutInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_container_two_column_12_widget').html()
      ),
      twoColumn21LayoutInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_container_two_column_21_widget').html()
      ),
      threeColumnLayoutInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_container_three_column_widget').html()
      ),
      containerBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_container_settings').html()
      ),
      containerBlockColumnSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_container_column_settings').html()
      ),

      buttonBlock: Handlebars.compile(
        jQuery('#newsletter_editor_template_button_block').html()
      ),
      buttonInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_button_widget').html()
      ),
      buttonBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_button_settings').html()
      ),

      dividerBlock: Handlebars.compile(
        jQuery('#newsletter_editor_template_divider_block').html()
      ),
      dividerInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_divider_widget').html()
      ),
      dividerBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_divider_settings').html()
      ),

      footerBlock: Handlebars.compile(
        jQuery('#newsletter_editor_template_footer_block').html()
      ),
      footerInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_footer_widget').html()
      ),
      footerBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_footer_settings').html()
      ),

      headerBlock: Handlebars.compile(
        jQuery('#newsletter_editor_template_header_block').html()
      ),
      headerInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_header_widget').html()
      ),
      headerBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_header_settings').html()
      ),

      imageBlock: Handlebars.compile(
        jQuery('#newsletter_editor_template_image_block').html()
      ),
      imageInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_image_widget').html()
      ),
      imageBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_image_settings').html()
      ),

      socialBlock: Handlebars.compile(
        jQuery('#newsletter_editor_template_social_block').html()
      ),
      socialIconBlock: Handlebars.compile(
        jQuery('#newsletter_editor_template_social_block_icon').html()
      ),
      socialInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_social_widget').html()
      ),
      socialBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_social_settings').html()
      ),
      socialSettingsIconSelector: Handlebars.compile(
        jQuery('#newsletter_editor_template_social_settings_icon_selector').html()
      ),
      socialSettingsIcon: Handlebars.compile(
        jQuery('#newsletter_editor_template_social_settings_icon').html()
      ),
      socialSettingsStyles: Handlebars.compile(
        jQuery('#newsletter_editor_template_social_settings_styles').html()
      ),

      spacerBlock: Handlebars.compile(
        jQuery('#newsletter_editor_template_spacer_block').html()
      ),
      spacerInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_spacer_widget').html()
      ),
      spacerBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_spacer_settings').html()
      ),

      automatedLatestContentBlock: Handlebars.compile(
        jQuery('#newsletter_editor_template_automated_latest_content_block').html()
      ),
      automatedLatestContentInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_automated_latest_content_widget').html()
      ),
      automatedLatestContentBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_automated_latest_content_settings').html()
      ),

      automatedLatestContentLayoutBlock: Handlebars.compile(
        jQuery('#newsletter_editor_template_automated_latest_content_layout_block').html()
      ),
      automatedLatestContentLayoutInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_automated_latest_content_layout_widget').html()
      ),
      automatedLatestContentLayoutBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_automated_latest_content_layout_settings').html()
      ),

      postsBlock: Handlebars.compile(
        jQuery('#newsletter_editor_template_posts_block').html()
      ),
      postsInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_posts_widget').html()
      ),
      postsBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_posts_settings').html()
      ),
      postSelectionPostsBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_posts_settings_selection').html()
      ),
      emptyPostPostsBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_posts_settings_selection_empty').html()
      ),
      singlePostPostsBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_posts_settings_single_post').html()
      ),
      displayOptionsPostsBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_posts_settings_display_options').html()
      ),

      productsBlock: Handlebars.compile(
        jQuery('#newsletter_editor_template_products_block').html()
      ),
      productsInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_products_widget').html()
      ),
      productsBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_products_settings').html()
      ),
      postSelectionProductsBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_products_settings_selection').html()
      ),
      emptyPostProductsBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_products_settings_selection_empty').html()
      ),
      singlePostProductsBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_products_settings_single_post').html()
      ),
      displayOptionsProductsBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_products_settings_display_options').html()
      ),

      abandonedCartContentBlock: Handlebars.compile(
        jQuery('#newsletter_editor_template_acc_block').html()
      ),
      abandonedCartContentInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_acc_widget').html()
      ),
      abandonedCartContentBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_acc_settings').html()
      ),
      displayOptionsAbandonedCartContentBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_acc_settings_display_options').html()
      ),

      textBlock: Handlebars.compile(
        jQuery('#newsletter_editor_template_text_block').html()
      ),
      textInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_text_widget').html()
      ),
      textBlockSettings: Handlebars.compile(
        jQuery('#newsletter_editor_template_text_settings').html()
      ),

      woocommerceNewAccount: Handlebars.compile(
        jQuery('#newsletter_editor_template_woocommerce_new_account_content').html()
      ),
      woocommerceProcessingOrder: Handlebars.compile(
        jQuery('#newsletter_editor_template_woocommerce_processing_order_content').html()
      ),
      woocommerceCompletedOrder: Handlebars.compile(
        jQuery('#newsletter_editor_template_woocommerce_completed_order_content').html()
      ),
      woocommerceCustomerNote: Handlebars.compile(
        jQuery('#newsletter_editor_template_woocommerce_customer_note_content').html()
      ),
      woocommerceContentInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_woocommerce_content_widget').html()
      ),

      woocommerceHeadingBlock: Handlebars.compile(
        jQuery('#newsletter_editor_template_woocommerce_heading_block').html()
      ),
      woocommerceHeadingInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_woocommerce_heading_widget').html()
      ),

      unknownBlockFallbackBlock: Handlebars.compile(
        jQuery('#newsletter_editor_template_unknown_block_fallback_block').html()
      ),
      unknownBlockFallbackInsertion: Handlebars.compile(
        jQuery('#newsletter_editor_template_unknown_block_fallback_widget').html()
      ),
    };

    var mailpoet_site_name = '";
        // line 711
        echo \MailPoetVendor\twig_escape_filter($this->env, ($context["site_name"] ?? null), "html", null, true);
        echo "';
    var mailpoet_site_address = '";
        // line 712
        echo \MailPoetVendor\twig_escape_filter($this->env, ($context["site_address"] ?? null), "html", null, true);
        echo "';
    var mailpoet_mss_key_pending_approval = '";
        // line 713
        echo \MailPoetVendor\twig_escape_filter($this->env, ($context["mss_key_pending_approval"] ?? null), "html", null, true);
        echo "';
    var currentUserEmail = '";
        // line 714
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_get_attribute($this->env, $this->source, ($context["current_wp_user"] ?? null), "user_email", [], "any", false, false, false, 714), "html", null, true);
        echo "';

    var config = {
      availableStyles: {
        textSizes: [
          '9px', '10px', '11px', '12px', '13px', '14px', '15px', '16px',
          '17px', '18px', '19px', '20px', '21px', '22px', '23px', '24px'
        ],
        headingSizes: [
          '10px', '12px', '14px', '16px', '18px', '20px', '22px', '24px',
          '26px', '30px', '36px', '40px'
        ],
        lineHeights: [
          '1.0',
          '1.2',
          '1.4',
          '1.6',
          '1.8',
          '2.0',
        ],
        fonts: {
          standard: [
            'Arial',
            'Comic Sans MS',
            'Courier New',
            'Georgia',
            'Lucida',
            'Tahoma',
            'Times New Roman',
            'Trebuchet MS',
            'Verdana'
          ],
          custom: [
            'Arvo',
            'Lato',
            'Lora',
            'Merriweather',
            'Merriweather Sans',
            'Noticia Text',
            'Open Sans',
            'Playfair Display',
            'Roboto',
            'Source Sans Pro',
            'Oswald',
            'Raleway',
            'Permanent Marker',
            'Pacifico',
          ]
        },
        socialIconSets: {
          'default': {
            'custom': '";
        // line 765
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/custom.png");
        // line 767
        echo "',
            'facebook': '";
        // line 768
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/01-social/Facebook.png");
        // line 770
        echo "',
            'twitter': '";
        // line 771
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/01-social/Twitter.png");
        // line 773
        echo "',
            'google-plus': '";
        // line 774
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/01-social/Google-Plus.png");
        // line 776
        echo "',
            'youtube': '";
        // line 777
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/01-social/Youtube.png");
        // line 779
        echo "',
            'website': '";
        // line 780
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/01-social/Website.png");
        // line 782
        echo "',
            'email': '";
        // line 783
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/01-social/Email.png");
        // line 785
        echo "',
            'instagram': '";
        // line 786
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/01-social/Instagram.png");
        // line 788
        echo "',
            'pinterest': '";
        // line 789
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/01-social/Pinterest.png");
        // line 791
        echo "',
            'linkedin': '";
        // line 792
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/01-social/LinkedIn.png");
        // line 794
        echo "'
          },
          'grey': {
            'custom': '";
        // line 797
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/custom.png");
        // line 799
        echo "',
            'facebook': '";
        // line 800
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/02-grey/Facebook.png");
        // line 802
        echo "',
            'twitter': '";
        // line 803
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/02-grey/Twitter.png");
        // line 805
        echo "',
            'google-plus': '";
        // line 806
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/02-grey/Google-Plus.png");
        // line 808
        echo "',
            'youtube': '";
        // line 809
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/02-grey/Youtube.png");
        // line 811
        echo "',
            'website': '";
        // line 812
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/02-grey/Website.png");
        // line 814
        echo "',
            'email': '";
        // line 815
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/02-grey/Email.png");
        // line 817
        echo "',
            'instagram': '";
        // line 818
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/02-grey/Instagram.png");
        // line 820
        echo "',
            'pinterest': '";
        // line 821
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/02-grey/Pinterest.png");
        // line 823
        echo "',
            'linkedin': '";
        // line 824
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/02-grey/LinkedIn.png");
        // line 826
        echo "',
          },
          'circles': {
            'custom': '";
        // line 829
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/custom.png");
        // line 831
        echo "',
            'facebook': '";
        // line 832
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/03-circles/Facebook.png");
        // line 834
        echo "',
            'twitter': '";
        // line 835
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/03-circles/Twitter.png");
        // line 837
        echo "',
            'google-plus': '";
        // line 838
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/03-circles/Google-Plus.png");
        // line 840
        echo "',
            'youtube': '";
        // line 841
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/03-circles/Youtube.png");
        // line 843
        echo "',
            'website': '";
        // line 844
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/03-circles/Website.png");
        // line 846
        echo "',
            'email': '";
        // line 847
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/03-circles/Email.png");
        // line 849
        echo "',
            'instagram': '";
        // line 850
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/03-circles/Instagram.png");
        // line 852
        echo "',
            'pinterest': '";
        // line 853
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/03-circles/Pinterest.png");
        // line 855
        echo "',
            'linkedin': '";
        // line 856
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/03-circles/LinkedIn.png");
        // line 858
        echo "',
          },
          'full-flat-roundrect': {
            'custom': '";
        // line 861
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/custom.png");
        // line 863
        echo "',
            'facebook': '";
        // line 864
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/04-full-flat-roundrect/Facebook.png");
        // line 866
        echo "',
            'twitter': '";
        // line 867
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/04-full-flat-roundrect/Twitter.png");
        // line 869
        echo "',
            'google-plus': '";
        // line 870
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/04-full-flat-roundrect/Google-Plus.png");
        // line 872
        echo "',
            'youtube': '";
        // line 873
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/04-full-flat-roundrect/Youtube.png");
        // line 875
        echo "',
            'website': '";
        // line 876
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/04-full-flat-roundrect/Website.png");
        // line 878
        echo "',
            'email': '";
        // line 879
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/04-full-flat-roundrect/Email.png");
        // line 881
        echo "',
            'instagram': '";
        // line 882
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/04-full-flat-roundrect/Instagram.png");
        // line 884
        echo "',
            'pinterest': '";
        // line 885
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/04-full-flat-roundrect/Pinterest.png");
        // line 887
        echo "',
            'linkedin': '";
        // line 888
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/04-full-flat-roundrect/LinkedIn.png");
        // line 890
        echo "',
          },
          'full-gradient-square': {
            'custom': '";
        // line 893
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/custom.png");
        // line 895
        echo "',
            'facebook': '";
        // line 896
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/05-full-gradient-square/Facebook.png");
        // line 898
        echo "',
            'twitter': '";
        // line 899
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/05-full-gradient-square/Twitter.png");
        // line 901
        echo "',
            'google-plus': '";
        // line 902
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/05-full-gradient-square/Google-Plus.png");
        // line 904
        echo "',
            'youtube': '";
        // line 905
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/05-full-gradient-square/Youtube.png");
        // line 907
        echo "',
            'website': '";
        // line 908
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/05-full-gradient-square/Website.png");
        // line 910
        echo "',
            'email': '";
        // line 911
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/05-full-gradient-square/Email.png");
        // line 913
        echo "',
            'instagram': '";
        // line 914
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/05-full-gradient-square/Instagram.png");
        // line 916
        echo "',
            'pinterest': '";
        // line 917
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/05-full-gradient-square/Pinterest.png");
        // line 919
        echo "',
            'linkedin': '";
        // line 920
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/05-full-gradient-square/LinkedIn.png");
        // line 922
        echo "',
          },
          'full-symbol-color': {
            'custom': '";
        // line 925
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/custom.png");
        // line 927
        echo "',
            'facebook': '";
        // line 928
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/06-full-symbol-color/Facebook.png");
        // line 930
        echo "',
            'twitter': '";
        // line 931
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/06-full-symbol-color/Twitter.png");
        // line 933
        echo "',
            'google-plus': '";
        // line 934
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/06-full-symbol-color/Google-Plus.png");
        // line 936
        echo "',
            'youtube': '";
        // line 937
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/06-full-symbol-color/Youtube.png");
        // line 939
        echo "',
            'website': '";
        // line 940
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/06-full-symbol-color/Website.png");
        // line 942
        echo "',
            'email': '";
        // line 943
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/06-full-symbol-color/Email.png");
        // line 945
        echo "',
            'instagram': '";
        // line 946
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/06-full-symbol-color/Instagram.png");
        // line 948
        echo "',
            'pinterest': '";
        // line 949
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/06-full-symbol-color/Pinterest.png");
        // line 951
        echo "',
            'linkedin': '";
        // line 952
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/06-full-symbol-color/LinkedIn.png");
        // line 954
        echo "',
          },
          'full-symbol-black': {
            'custom': '";
        // line 957
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/custom.png");
        // line 959
        echo "',
            'facebook': '";
        // line 960
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/07-full-symbol-black/Facebook.png");
        // line 962
        echo "',
            'twitter': '";
        // line 963
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/07-full-symbol-black/Twitter.png");
        // line 965
        echo "',
            'google-plus': '";
        // line 966
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/07-full-symbol-black/Google-Plus.png");
        // line 968
        echo "',
            'youtube': '";
        // line 969
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/07-full-symbol-black/Youtube.png");
        // line 971
        echo "',
            'website': '";
        // line 972
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/07-full-symbol-black/Website.png");
        // line 974
        echo "',
            'email': '";
        // line 975
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/07-full-symbol-black/Email.png");
        // line 977
        echo "',
            'instagram': '";
        // line 978
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/07-full-symbol-black/Instagram.png");
        // line 980
        echo "',
            'pinterest': '";
        // line 981
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/07-full-symbol-black/Pinterest.png");
        // line 983
        echo "',
            'linkedin': '";
        // line 984
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/07-full-symbol-black/LinkedIn.png");
        // line 986
        echo "',
          },
          'full-symbol-grey': {
            'custom': '";
        // line 989
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/custom.png");
        // line 991
        echo "',
            'facebook': '";
        // line 992
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/08-full-symbol-grey/Facebook.png");
        // line 994
        echo "',
            'twitter': '";
        // line 995
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/08-full-symbol-grey/Twitter.png");
        // line 997
        echo "',
            'google-plus': '";
        // line 998
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/08-full-symbol-grey/Google-Plus.png");
        // line 1000
        echo "',
            'youtube': '";
        // line 1001
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/08-full-symbol-grey/Youtube.png");
        // line 1003
        echo "',
            'website': '";
        // line 1004
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/08-full-symbol-grey/Website.png");
        // line 1006
        echo "',
            'email': '";
        // line 1007
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/08-full-symbol-grey/Email.png");
        // line 1009
        echo "',
            'instagram': '";
        // line 1010
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/08-full-symbol-grey/Instagram.png");
        // line 1012
        echo "',
            'pinterest': '";
        // line 1013
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/08-full-symbol-grey/Pinterest.png");
        // line 1015
        echo "',
            'linkedin': '";
        // line 1016
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/08-full-symbol-grey/LinkedIn.png");
        // line 1018
        echo "',
          },
          'line-roundrect': {
            'custom': '";
        // line 1021
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/custom.png");
        // line 1023
        echo "',
            'facebook': '";
        // line 1024
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/09-line-roundrect/Facebook.png");
        // line 1026
        echo "',
            'twitter': '";
        // line 1027
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/09-line-roundrect/Twitter.png");
        // line 1029
        echo "',
            'google-plus': '";
        // line 1030
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/09-line-roundrect/Google-Plus.png");
        // line 1032
        echo "',
            'youtube': '";
        // line 1033
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/09-line-roundrect/Youtube.png");
        // line 1035
        echo "',
            'website': '";
        // line 1036
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/09-line-roundrect/Website.png");
        // line 1038
        echo "',
            'email': '";
        // line 1039
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/09-line-roundrect/Email.png");
        // line 1041
        echo "',
            'instagram': '";
        // line 1042
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/09-line-roundrect/Instagram.png");
        // line 1044
        echo "',
            'pinterest': '";
        // line 1045
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/09-line-roundrect/Pinterest.png");
        // line 1047
        echo "',
            'linkedin': '";
        // line 1048
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/09-line-roundrect/LinkedIn.png");
        // line 1050
        echo "',
          },
          'line-square': {
            'custom': '";
        // line 1053
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/custom.png");
        // line 1055
        echo "',
            'facebook': '";
        // line 1056
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/10-line-square/Facebook.png");
        // line 1058
        echo "',
            'twitter': '";
        // line 1059
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/10-line-square/Twitter.png");
        // line 1061
        echo "',
            'google-plus': '";
        // line 1062
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/10-line-square/Google-Plus.png");
        // line 1064
        echo "',
            'youtube': '";
        // line 1065
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/10-line-square/Youtube.png");
        // line 1067
        echo "',
            'website': '";
        // line 1068
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/10-line-square/Website.png");
        // line 1070
        echo "',
            'email': '";
        // line 1071
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/10-line-square/Email.png");
        // line 1073
        echo "',
            'instagram': '";
        // line 1074
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/10-line-square/Instagram.png");
        // line 1076
        echo "',
            'pinterest': '";
        // line 1077
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/10-line-square/Pinterest.png");
        // line 1079
        echo "',
            'linkedin': '";
        // line 1080
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/10-line-square/LinkedIn.png");
        // line 1082
        echo "',
          },
        },
        dividers: [
          'hidden',
          'dotted',
          'dashed',
          'solid',
          'double',
          'groove',
          'ridge'
        ]
      },
      socialIcons: {
        'facebook': {
          title: 'Facebook',
          linkFieldName: '";
        // line 1098
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Link"), "js"), "html", null, true);
        echo "',
          defaultLink: 'http://www.facebook.com',
        },
        'twitter': {
          title: 'Twitter',
          linkFieldName: '";
        // line 1103
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Link"), "js"), "html", null, true);
        echo "',
          defaultLink: 'http://www.twitter.com',
        },
        'google-plus': {
          title: 'Google Plus',
          linkFieldName: '";
        // line 1108
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Link"), "js"), "html", null, true);
        echo "',
          defaultLink: 'http://plus.google.com',
        },
        'youtube': {
          title: 'Youtube',
          linkFieldName: '";
        // line 1113
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Link"), "js"), "html", null, true);
        echo "',
          defaultLink: 'http://www.youtube.com',
        },
        'website': {
          title: '";
        // line 1117
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Website"), "js"), "html", null, true);
        echo "',
          linkFieldName: '";
        // line 1118
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Link"), "js"), "html", null, true);
        echo "',
          defaultLink: '',
        },
        'email': {
          title: '";
        // line 1122
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Email"), "js"), "html", null, true);
        echo "',
          linkFieldName: '";
        // line 1123
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Email"), "js"), "html", null, true);
        echo "',
          defaultLink: '',
        },
        'instagram': {
          title: 'Instagram',
          linkFieldName: '";
        // line 1128
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Link"), "js"), "html", null, true);
        echo "',
          defaultLink: 'http://instagram.com',
        },
        'pinterest': {
          title: 'Pinterest',
          linkFieldName: '";
        // line 1133
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Link"), "js"), "html", null, true);
        echo "',
          defaultLink: 'http://www.pinterest.com',
        },
        'linkedin': {
          title: 'LinkedIn',
          linkFieldName: '";
        // line 1138
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Link"), "js"), "html", null, true);
        echo "',
          defaultLink: 'http://www.linkedin.com',
        },
        'custom': {
          title: '";
        // line 1142
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Custom"), "js"), "html", null, true);
        echo "',
          linkFieldName: '";
        // line 1143
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Link"), "js"), "html", null, true);
        echo "',
          defaultLink: '',
        },
      },
      blockDefaults: {
        abandonedCartContent: {
          amount: '2',
          withLayout: true,
          contentType: 'product',
          postStatus: 'publish', // 'draft'|'pending'|'publish'
          inclusionType: 'include', // 'include'|'exclude'
          displayType: 'excerpt', // 'excerpt'|'full'|'titleOnly'
          titleFormat: 'h1', // 'h1'|'h2'|'h3'
          titleAlignment: 'left', // 'left'|'center'|'right'
          titleIsLink: false, // false|true
          imageFullWidth: false, // true|false
          featuredImagePosition: 'alternate', // 'centered'|'left'|'right'|'alternate'|'none',
          pricePosition: 'below', // 'hidden'|'above'|'below'
          readMoreType: 'none', // 'link'|'button'|'none'
          readMoreText: '',
          readMoreButton: {},
          sortBy: 'newest', // 'newest'|'oldest',
          showDivider: true, // true|false
          divider: {
            context: 'abandonedCartContent.divider',
            styles: {
              block: {
                backgroundColor: 'transparent',
                padding: '13px',
                borderStyle: 'solid',
                borderWidth: '3px',
                borderColor: '#aaaaaa',
              },
            },
          },
          backgroundColor: '#ffffff',
          backgroundColorAlternate: '#eeeeee',
        },
        automatedLatestContent: {
          amount: '5',
          withLayout: false,
          contentType: 'post', // 'post'|'page'|'mailpoet_page'
          inclusionType: 'include', // 'include'|'exclude'
          displayType: 'excerpt', // 'excerpt'|'full'|'titleOnly'
          titleFormat: 'h1', // 'h1'|'h2'|'h3'|'ul'
          titleAlignment: 'left', // 'left'|'center'|'right'
          titleIsLink: false, // false|true
          imageFullWidth: false, // true|false
          featuredImagePosition: 'belowTitle', // 'belowTitle'|'aboveTitle'|'none',
          showAuthor: 'no', // 'no'|'aboveText'|'belowText'
          authorPrecededBy: '";
        // line 1193
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Author:"), "js"), "html", null, true);
        echo "',
          showCategories: 'no', // 'no'|'aboveText'|'belowText'
          categoriesPrecededBy: '";
        // line 1195
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Categories:"), "js"), "html", null, true);
        echo "',
          readMoreType: 'button', // 'link'|'button'
          readMoreText: '";
        // line 1197
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Read more"), "js"), "html", null, true);
        echo "',
          readMoreButton: {
            text: '";
        // line 1199
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Read more"), "js"), "html", null, true);
        echo "',
            url: '[postLink]',
            context: 'automatedLatestContent.readMoreButton',
            styles: {
              block: {
                backgroundColor: '#2ea1cd',
                borderColor: '#0074a2',
                borderWidth: '1px',
                borderRadius: '5px',
                borderStyle: 'solid',
                width: '180px',
                lineHeight: '40px',
                fontColor: '#ffffff',
                fontFamily: 'Verdana',
                fontSize: '18px',
                fontWeight: 'normal',
                textAlign: 'center',
              }
            }
          },
          sortBy: 'newest', // 'newest'|'oldest',
          showDivider: true, // true|false
          divider: {
            context: 'automatedLatestContent.divider',
            styles: {
              block: {
                backgroundColor: 'transparent',
                padding: '13px',
                borderStyle: 'solid',
                borderWidth: '3px',
                borderColor: '#aaaaaa',
              },
            },
          },
          backgroundColor: '#ffffff',
          backgroundColorAlternate: '#eeeeee',
        },
        automatedLatestContentLayout: {
          amount: '5',
          withLayout: true,
          contentType: 'post', // 'post'|'page'|'mailpoet_page'
          inclusionType: 'include', // 'include'|'exclude'
          displayType: 'excerpt', // 'excerpt'|'full'|'titleOnly'
          titleFormat: 'h1', // 'h1'|'h2'|'h3'|'ul'
          titleAlignment: 'left', // 'left'|'center'|'right'
          titleIsLink: false, // false|true
          imageFullWidth: false, // true|false
          featuredImagePosition: 'alternate', // 'centered'|'left'|'right'|'alternate'|'none',
          showAuthor: 'no', // 'no'|'aboveText'|'belowText'
          authorPrecededBy: '";
        // line 1248
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Author:"), "js"), "html", null, true);
        echo "',
          showCategories: 'no', // 'no'|'aboveText'|'belowText'
          categoriesPrecededBy: '";
        // line 1250
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Categories:"), "js"), "html", null, true);
        echo "',
          readMoreType: 'button', // 'link'|'button'
          readMoreText: '";
        // line 1252
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Read more"), "js"), "html", null, true);
        echo "',
          readMoreButton: {
            text: '";
        // line 1254
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Read more"), "js"), "html", null, true);
        echo "',
            url: '[postLink]',
            context: 'automatedLatestContentLayout.readMoreButton',
            styles: {
              block: {
                backgroundColor: '#2ea1cd',
                borderColor: '#0074a2',
                borderWidth: '1px',
                borderRadius: '5px',
                borderStyle: 'solid',
                width: '180px',
                lineHeight: '40px',
                fontColor: '#ffffff',
                fontFamily: 'Verdana',
                fontSize: '18px',
                fontWeight: 'normal',
                textAlign: 'center',
              }
            }
          },
          sortBy: 'newest', // 'newest'|'oldest',
          showDivider: true, // true|false
          divider: {
            context: 'automatedLatestContentLayout.divider',
            styles: {
              block: {
                backgroundColor: 'transparent',
                padding: '13px',
                borderStyle: 'solid',
                borderWidth: '3px',
                borderColor: '#aaaaaa',
              },
            },
          },
          backgroundColor: '#ffffff',
          backgroundColorAlternate: '#eeeeee',
        },
        button: {
          text: '";
        // line 1292
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Button"), "js"), "html", null, true);
        echo "',
          url: '',
          styles: {
            block: {
              backgroundColor: '#2ea1cd',
              borderColor: '#0074a2',
              borderWidth: '1px',
              borderRadius: '5px',
              borderStyle: 'solid',
              width: '180px',
              lineHeight: '40px',
              fontColor: '#ffffff',
              fontFamily: 'Verdana',
              fontSize: '18px',
              fontWeight: 'normal',
              textAlign: 'center',
            },
          },
        },
        container: {
          image: {
            src: null,
            display: 'scale',
          },
          styles: {
            block: {
              backgroundColor: 'transparent',
            },
          },
        },
        divider: {
          styles: {
            block: {
              backgroundColor: 'transparent',
              padding: '13px',
              borderStyle: 'solid',
              borderWidth: '3px',
              borderColor: '#aaaaaa',
            },
          },
        },
        footer: {
          text: '<p><a href=\"[link:subscription_unsubscribe_url]\">";
        // line 1334
        echo $this->extensions['MailPoet\Twig\I18n']->translate("Unsubscribe");
        echo "</a> | <a href=\"[link:subscription_manage_url]\">";
        echo $this->extensions['MailPoet\Twig\I18n']->translate("Manage subscription");
        echo "</a><br />";
        echo $this->extensions['MailPoet\Twig\I18n']->translate("Add your postal address here!");
        echo "</p>',
          styles: {
            block: {
              backgroundColor: 'transparent',
            },
            text: {
              fontColor: '#222222',
              fontFamily: 'Arial',
              fontSize: '12px',
              textAlign: 'center',
            },
            link: {
              fontColor: '#6cb7d4',
              textDecoration: 'none',
            },
          },
        },
        image: {
          link: '',
          src: '',
          alt: '";
        // line 1354
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("An image of..."), "js"), "html", null, true);
        echo "',
          fullWidth: false,
          width: '281px',
          height: '190px',
          styles: {
            block: {
              textAlign: 'center',
            },
          },
        },
        posts: {
          amount: '10',
          withLayout: true,
          contentType: 'post', // 'post'|'page'|'mailpoet_page'
          postStatus: 'publish', // 'draft'|'pending'|'private'|'publish'|'future'
          inclusionType: 'include', // 'include'|'exclude'
          displayType: 'excerpt', // 'excerpt'|'full'|'titleOnly'
          titleFormat: 'h1', // 'h1'|'h2'|'h3'|'ul'
          titleAlignment: 'left', // 'left'|'center'|'right'
          titleIsLink: false, // false|true
          imageFullWidth: false, // true|false
          featuredImagePosition: 'alternate', // 'centered'|'left'|'right'|'alternate'|'none',
          showAuthor: 'no', // 'no'|'aboveText'|'belowText'
          authorPrecededBy: '";
        // line 1377
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Author:"), "js"), "html", null, true);
        echo "',
          showCategories: 'no', // 'no'|'aboveText'|'belowText'
          categoriesPrecededBy: '";
        // line 1379
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Categories:"), "js"), "html", null, true);
        echo "',
          readMoreType: 'link', // 'link'|'button'
          readMoreText: '";
        // line 1381
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Read more"), "js"), "html", null, true);
        echo "',
          readMoreButton: {
            text: '";
        // line 1383
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Read more"), "js"), "html", null, true);
        echo "',
            url: '[postLink]',
            context: 'posts.readMoreButton',
            styles: {
              block: {
                backgroundColor: '#2ea1cd',
                borderColor: '#0074a2',
                borderWidth: '1px',
                borderRadius: '5px',
                borderStyle: 'solid',
                width: '180px',
                lineHeight: '40px',
                fontColor: '#ffffff',
                fontFamily: 'Verdana',
                fontSize: '18px',
                fontWeight: 'normal',
                textAlign: 'center',
              },
            },
          },
          sortBy: 'newest', // 'newest'|'oldest',
          showDivider: true, // true|false
          divider: {
            context: 'posts.divider',
            styles: {
              block: {
                backgroundColor: 'transparent',
                padding: '13px',
                borderStyle: 'solid',
                borderWidth: '3px',
                borderColor: '#aaaaaa',
              },
            },
          },
          backgroundColor: '#ffffff',
          backgroundColorAlternate: '#eeeeee',
        },
        products: {
          amount: '10',
          withLayout: true,
          contentType: 'product',
          postStatus: 'publish', // 'draft'|'pending'|'publish'
          inclusionType: 'include', // 'include'|'exclude'
          displayType: 'excerpt', // 'excerpt'|'full'|'titleOnly'
          titleFormat: 'h1', // 'h1'|'h2'|'h3'
          titleAlignment: 'left', // 'left'|'center'|'right'
          titleIsLink: false, // false|true
          imageFullWidth: false, // true|false
          featuredImagePosition: 'alternate', // 'centered'|'left'|'right'|'alternate'|'none',
          pricePosition: 'below', // 'hidden'|'above'|'below'
          readMoreType: 'link', // 'link'|'button'
          readMoreText: '";
        // line 1434
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translateWithContext("Buy now", "Text of a button which links to an ecommerce product page"), "js"), "html", null, true);
        echo "',
          readMoreButton: {
            text: '";
        // line 1436
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translateWithContext("Buy now", "Text of a button which links to an ecommerce product page"), "js"), "html", null, true);
        echo "',
            url: '[postLink]',
            context: 'posts.readMoreButton',
            styles: {
              block: {
                backgroundColor: '#2ea1cd',
                borderColor: '#0074a2',
                borderWidth: '1px',
                borderRadius: '5px',
                borderStyle: 'solid',
                width: '180px',
                lineHeight: '40px',
                fontColor: '#ffffff',
                fontFamily: 'Verdana',
                fontSize: '18px',
                fontWeight: 'normal',
                textAlign: 'center',
              },
            },
          },
          sortBy: 'newest', // 'newest'|'oldest',
          showDivider: true, // true|false
          divider: {
            context: 'posts.divider',
            styles: {
              block: {
                backgroundColor: 'transparent',
                padding: '13px',
                borderStyle: 'solid',
                borderWidth: '3px',
                borderColor: '#aaaaaa',
              },
            },
          },
          backgroundColor: '#ffffff',
          backgroundColorAlternate: '#eeeeee',
        },
        social: {
          iconSet: 'default',
          styles: {
            block: {
              textAlign: 'center'
            }
          },
          icons: [
          {
            type: 'socialIcon',
            iconType: 'facebook',
            link: 'http://www.facebook.com',
            image: '";
        // line 1485
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/01-social/Facebook.png");
        // line 1487
        echo "',
            height: '32px',
            width: '32px',
            text: '";
        // line 1490
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Facebook"), "js"), "html", null, true);
        echo "',
          },
          {
            type: 'socialIcon',
            iconType: 'twitter',
            link: 'http://www.twitter.com',
            image: '";
        // line 1496
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/social-icons/01-social/Twitter.png");
        // line 1498
        echo "',
            height: '32px',
            width: '32px',
            text: '";
        // line 1501
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Twitter"), "js"), "html", null, true);
        echo "',
          },
          ],
        },
        spacer: {
          styles: {
            block: {
              backgroundColor: 'transparent',
              height: '40px',
            },
          },
        },
        text: {
          text: '";
        // line 1514
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_escape_filter($this->env, $this->extensions['MailPoet\Twig\I18n']->translate("Edit this to insert text."), "js"), "html", null, true);
        echo "',
        },
        header: {
          text: '<a href=\"[link:newsletter_view_in_browser_url]\">";
        // line 1517
        echo $this->extensions['MailPoet\Twig\I18n']->translate("View this in your browser.");
        echo "</a>',
          styles: {
            block: {
              backgroundColor: 'transparent',
            },
            text: {
              fontColor: '#222222',
              fontFamily: 'Arial',
              fontSize: '12px',
              textAlign: 'center',
            },
            link: {
              fontColor: '#6cb7d4',
              textDecoration: 'underline',
            },
          },
        },
        woocommerceHeading: {
          contents: ";
        // line 1535
        echo json_encode(\MailPoetVendor\twig_get_attribute($this->env, $this->source, ($context["woocommerce"] ?? null), "email_headings", [], "any", false, false, false, 1535));
        echo ",
        },
      },
      shortcodes: ";
        // line 1538
        echo json_encode(($context["shortcodes"] ?? null));
        echo ",
      sidepanelWidth: '331px',
      newsletterPreview: {
        width: '1024px',
        height: '768px',
        previewTypeLocalStorageKey: 'newsletter_editor.preview_type'
      },
      validation: {
        validateUnsubscribeLinkPresent: ";
        // line 1546
        echo (((($context["mss_active"] ?? null) && (($context["is_wc_transactional_email"] ?? null) != true))) ? ("true") : ("false"));
        echo ",
        validateReEngageLinkPresent: ";
        // line 1547
        echo (((($context["mss_active"] ?? null) && (($context["is_wc_transactional_email"] ?? null) != true))) ? ("true") : ("false"));
        echo ",
      },
      urls: {
        send: '";
        // line 1550
        echo admin_url(("admin.php?page=mailpoet-newsletters#/send/" . intval($this->extensions['MailPoet\Twig\Functions']->params("id"))));
        echo "',
        imageMissing: '";
        // line 1551
        echo $this->extensions['MailPoet\Twig\Assets']->generateImageUrl("newsletter_editor/image-missing.svg");
        // line 1553
        echo "',
      },
      dragDemoUrl: '";
        // line 1555
        echo $this->extensions['MailPoet\Twig\Assets']->generateCdnUrl("newsletter-editor/editor-drag-demo.20190226-1505.mp4");
        echo "',
      currentUserId: '";
        // line 1556
        echo \MailPoetVendor\twig_escape_filter($this->env, \MailPoetVendor\twig_get_attribute($this->env, $this->source, ($context["current_wp_user"] ?? null), "wp_user_id", [], "any", false, false, false, 1556), "html", null, true);
        echo "',
      dragDemoUrlSettings: '";
        // line 1557
        echo \MailPoetVendor\twig_escape_filter($this->env, ($context["editor_tutorial_seen"] ?? null), "html", null, true);
        echo "',
      installedAt: '";
        // line 1558
        echo \MailPoetVendor\twig_escape_filter($this->env, (($__internal_compile_0 = ($context["settings"] ?? null)) && is_array($__internal_compile_0) || $__internal_compile_0 instanceof ArrayAccess ? ($__internal_compile_0["installed_at"] ?? null) : null), "html", null, true);
        echo "',
      mtaMethod: '";
        // line 1559
        echo \MailPoetVendor\twig_escape_filter($this->env, (($__internal_compile_1 = (($__internal_compile_2 = ($context["settings"] ?? null)) && is_array($__internal_compile_2) || $__internal_compile_2 instanceof ArrayAccess ? ($__internal_compile_2["mta"] ?? null) : null)) && is_array($__internal_compile_1) || $__internal_compile_1 instanceof ArrayAccess ? ($__internal_compile_1["method"] ?? null) : null), "html", null, true);
        echo "',
      woocommerceCustomizerEnabled: ";
        // line 1560
        echo ((\MailPoetVendor\twig_get_attribute($this->env, $this->source, ($context["woocommerce"] ?? null), "customizer_enabled", [], "any", false, false, false, 1560)) ? ("true") : ("false"));
        echo ",
      ";
        // line 1561
        if (($context["is_wc_transactional_email"] ?? null)) {
            // line 1562
            echo "      overrideGlobalStyles: {
        text: {
          fontColor: ";
            // line 1564
            echo json_encode(\MailPoetVendor\twig_get_attribute($this->env, $this->source, ($context["woocommerce"] ?? null), "text_color", [], "any", false, false, false, 1564));
            echo ",
        },
        h1: {
          fontColor: ";
            // line 1567
            echo json_encode(\MailPoetVendor\twig_get_attribute($this->env, $this->source, ($context["woocommerce"] ?? null), "base_color", [], "any", false, false, false, 1567));
            echo ",
        },
        h2: {
          fontColor: ";
            // line 1570
            echo json_encode(\MailPoetVendor\twig_get_attribute($this->env, $this->source, ($context["woocommerce"] ?? null), "base_color", [], "any", false, false, false, 1570));
            echo ",
        },
        h3: {
          fontColor: ";
            // line 1573
            echo json_encode(\MailPoetVendor\twig_get_attribute($this->env, $this->source, ($context["woocommerce"] ?? null), "base_color", [], "any", false, false, false, 1573));
            echo ",
        },
        link: {
          fontColor: ";
            // line 1576
            echo json_encode(\MailPoetVendor\twig_get_attribute($this->env, $this->source, ($context["woocommerce"] ?? null), "link_color", [], "any", false, false, false, 1576));
            echo ",
        },
        wrapper: {
          backgroundColor: ";
            // line 1579
            echo json_encode(\MailPoetVendor\twig_get_attribute($this->env, $this->source, ($context["woocommerce"] ?? null), "body_background_color", [], "any", false, false, false, 1579));
            echo ",
        },
        body: {
          backgroundColor: ";
            // line 1582
            echo json_encode(\MailPoetVendor\twig_get_attribute($this->env, $this->source, ($context["woocommerce"] ?? null), "background_color", [], "any", false, false, false, 1582));
            echo ",
        },
        woocommerce: {
          brandingColor: ";
            // line 1585
            echo json_encode(\MailPoetVendor\twig_get_attribute($this->env, $this->source, ($context["woocommerce"] ?? null), "base_color", [], "any", false, false, false, 1585));
            echo ",
          headingFontColor: ";
            // line 1586
            echo json_encode(\MailPoetVendor\twig_get_attribute($this->env, $this->source, ($context["woocommerce"] ?? null), "base_text_color", [], "any", false, false, false, 1586));
            echo ",
        },
      },
      hiddenWidgets: ['automatedLatestContentLayout', 'header', 'footer', 'posts', 'products'],
      ";
        }
        // line 1591
        echo "    };
    wp.hooks.doAction('mailpoet_newsletters_editor_initialize', config);

  </script>
";
    }

    public function getTemplateName()
    {
        return "newsletter/editor.html";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  2087 => 1591,  2079 => 1586,  2075 => 1585,  2069 => 1582,  2063 => 1579,  2057 => 1576,  2051 => 1573,  2045 => 1570,  2039 => 1567,  2033 => 1564,  2029 => 1562,  2027 => 1561,  2023 => 1560,  2019 => 1559,  2015 => 1558,  2011 => 1557,  2007 => 1556,  2003 => 1555,  1999 => 1553,  1997 => 1551,  1993 => 1550,  1987 => 1547,  1983 => 1546,  1972 => 1538,  1966 => 1535,  1945 => 1517,  1939 => 1514,  1923 => 1501,  1918 => 1498,  1916 => 1496,  1907 => 1490,  1902 => 1487,  1900 => 1485,  1848 => 1436,  1843 => 1434,  1789 => 1383,  1784 => 1381,  1779 => 1379,  1774 => 1377,  1748 => 1354,  1721 => 1334,  1676 => 1292,  1635 => 1254,  1630 => 1252,  1625 => 1250,  1620 => 1248,  1568 => 1199,  1563 => 1197,  1558 => 1195,  1553 => 1193,  1500 => 1143,  1496 => 1142,  1489 => 1138,  1481 => 1133,  1473 => 1128,  1465 => 1123,  1461 => 1122,  1454 => 1118,  1450 => 1117,  1443 => 1113,  1435 => 1108,  1427 => 1103,  1419 => 1098,  1401 => 1082,  1399 => 1080,  1396 => 1079,  1394 => 1077,  1391 => 1076,  1389 => 1074,  1386 => 1073,  1384 => 1071,  1381 => 1070,  1379 => 1068,  1376 => 1067,  1374 => 1065,  1371 => 1064,  1369 => 1062,  1366 => 1061,  1364 => 1059,  1361 => 1058,  1359 => 1056,  1356 => 1055,  1354 => 1053,  1349 => 1050,  1347 => 1048,  1344 => 1047,  1342 => 1045,  1339 => 1044,  1337 => 1042,  1334 => 1041,  1332 => 1039,  1329 => 1038,  1327 => 1036,  1324 => 1035,  1322 => 1033,  1319 => 1032,  1317 => 1030,  1314 => 1029,  1312 => 1027,  1309 => 1026,  1307 => 1024,  1304 => 1023,  1302 => 1021,  1297 => 1018,  1295 => 1016,  1292 => 1015,  1290 => 1013,  1287 => 1012,  1285 => 1010,  1282 => 1009,  1280 => 1007,  1277 => 1006,  1275 => 1004,  1272 => 1003,  1270 => 1001,  1267 => 1000,  1265 => 998,  1262 => 997,  1260 => 995,  1257 => 994,  1255 => 992,  1252 => 991,  1250 => 989,  1245 => 986,  1243 => 984,  1240 => 983,  1238 => 981,  1235 => 980,  1233 => 978,  1230 => 977,  1228 => 975,  1225 => 974,  1223 => 972,  1220 => 971,  1218 => 969,  1215 => 968,  1213 => 966,  1210 => 965,  1208 => 963,  1205 => 962,  1203 => 960,  1200 => 959,  1198 => 957,  1193 => 954,  1191 => 952,  1188 => 951,  1186 => 949,  1183 => 948,  1181 => 946,  1178 => 945,  1176 => 943,  1173 => 942,  1171 => 940,  1168 => 939,  1166 => 937,  1163 => 936,  1161 => 934,  1158 => 933,  1156 => 931,  1153 => 930,  1151 => 928,  1148 => 927,  1146 => 925,  1141 => 922,  1139 => 920,  1136 => 919,  1134 => 917,  1131 => 916,  1129 => 914,  1126 => 913,  1124 => 911,  1121 => 910,  1119 => 908,  1116 => 907,  1114 => 905,  1111 => 904,  1109 => 902,  1106 => 901,  1104 => 899,  1101 => 898,  1099 => 896,  1096 => 895,  1094 => 893,  1089 => 890,  1087 => 888,  1084 => 887,  1082 => 885,  1079 => 884,  1077 => 882,  1074 => 881,  1072 => 879,  1069 => 878,  1067 => 876,  1064 => 875,  1062 => 873,  1059 => 872,  1057 => 870,  1054 => 869,  1052 => 867,  1049 => 866,  1047 => 864,  1044 => 863,  1042 => 861,  1037 => 858,  1035 => 856,  1032 => 855,  1030 => 853,  1027 => 852,  1025 => 850,  1022 => 849,  1020 => 847,  1017 => 846,  1015 => 844,  1012 => 843,  1010 => 841,  1007 => 840,  1005 => 838,  1002 => 837,  1000 => 835,  997 => 834,  995 => 832,  992 => 831,  990 => 829,  985 => 826,  983 => 824,  980 => 823,  978 => 821,  975 => 820,  973 => 818,  970 => 817,  968 => 815,  965 => 814,  963 => 812,  960 => 811,  958 => 809,  955 => 808,  953 => 806,  950 => 805,  948 => 803,  945 => 802,  943 => 800,  940 => 799,  938 => 797,  933 => 794,  931 => 792,  928 => 791,  926 => 789,  923 => 788,  921 => 786,  918 => 785,  916 => 783,  913 => 782,  911 => 780,  908 => 779,  906 => 777,  903 => 776,  901 => 774,  898 => 773,  896 => 771,  893 => 770,  891 => 768,  888 => 767,  886 => 765,  832 => 714,  828 => 713,  824 => 712,  820 => 711,  537 => 431,  531 => 429,  527 => 428,  520 => 425,  516 => 424,  511 => 421,  508 => 363,  504 => 362,  494 => 354,  492 => 353,  464 => 328,  461 => 327,  457 => 326,  452 => 323,  450 => 320,  447 => 319,  445 => 316,  442 => 315,  440 => 312,  437 => 311,  435 => 308,  432 => 307,  430 => 304,  427 => 303,  425 => 300,  422 => 299,  420 => 296,  417 => 295,  415 => 292,  412 => 291,  410 => 288,  407 => 287,  405 => 284,  402 => 283,  400 => 280,  397 => 279,  395 => 276,  392 => 275,  390 => 272,  387 => 271,  385 => 268,  382 => 267,  380 => 264,  377 => 263,  375 => 260,  372 => 259,  370 => 256,  367 => 255,  365 => 252,  362 => 251,  360 => 248,  357 => 247,  355 => 244,  352 => 243,  350 => 240,  347 => 239,  345 => 236,  342 => 235,  340 => 232,  337 => 231,  335 => 228,  332 => 227,  330 => 224,  327 => 223,  325 => 220,  322 => 219,  320 => 216,  317 => 215,  315 => 212,  312 => 211,  310 => 208,  307 => 207,  305 => 204,  302 => 203,  300 => 200,  297 => 199,  295 => 196,  292 => 195,  290 => 192,  287 => 191,  285 => 188,  282 => 187,  280 => 184,  277 => 183,  275 => 180,  272 => 179,  270 => 176,  267 => 175,  265 => 172,  262 => 171,  260 => 168,  257 => 167,  255 => 164,  252 => 163,  250 => 160,  247 => 159,  245 => 156,  242 => 155,  240 => 152,  237 => 151,  235 => 148,  232 => 147,  230 => 144,  227 => 143,  225 => 140,  222 => 139,  220 => 136,  217 => 135,  215 => 132,  212 => 131,  210 => 128,  207 => 127,  205 => 124,  202 => 123,  200 => 120,  197 => 119,  195 => 116,  192 => 115,  190 => 112,  187 => 111,  185 => 108,  182 => 107,  180 => 104,  177 => 103,  175 => 100,  172 => 99,  170 => 96,  167 => 95,  165 => 92,  162 => 91,  160 => 88,  157 => 87,  155 => 84,  152 => 83,  150 => 80,  147 => 79,  145 => 76,  142 => 75,  140 => 72,  137 => 71,  135 => 68,  132 => 67,  130 => 64,  127 => 63,  125 => 60,  122 => 59,  120 => 56,  117 => 55,  115 => 52,  112 => 51,  110 => 48,  107 => 47,  105 => 44,  102 => 43,  100 => 40,  97 => 39,  95 => 36,  92 => 35,  90 => 32,  87 => 31,  85 => 28,  82 => 27,  80 => 24,  77 => 23,  75 => 20,  72 => 19,  70 => 16,  67 => 15,  65 => 12,  62 => 11,  60 => 8,  57 => 7,  54 => 4,  50 => 3,  39 => 1,);
    }

    public function getSourceContext()
    {
        return new Source("", "newsletter/editor.html", "/home/bigfatpharma/public_html/wp-content/plugins/mailpoet/views/newsletter/editor.html");
    }
}
