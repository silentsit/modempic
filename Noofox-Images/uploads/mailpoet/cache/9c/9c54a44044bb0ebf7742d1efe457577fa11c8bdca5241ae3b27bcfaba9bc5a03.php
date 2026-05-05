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

/* newsletter/templates/blocks/button/block.hbs */
class __TwigTemplate_a1e3493cfb621af33da7c2ce75f8f92612404f295830b218e1471bbdacf7e650 extends \MailPoetVendor\Twig\Template
{
    private $source;
    private $macros = [];

    public function __construct(Environment $env)
    {
        parent::__construct($env);

        $this->source = $this->getSourceContext();

        $this->parent = false;

        $this->blocks = [
        ];
    }

    protected function doDisplay(array $context, array $blocks = [])
    {
        $macros = $this->macros;
        // line 1
        echo "<div class=\"mailpoet_tools\"></div>
<div class=\"mailpoet_content\">
    <a href=\"{{ model.url }}\" class=\"mailpoet_editor_button\" style=\"{{#ifCond model.styles.block.textAlign '==' 'left'}}margin: 0 auto 0 0; {{/ifCond}}{{#ifCond model.styles.block.textAlign '==' 'center'}}margin: auto; {{/ifCond}}{{#ifCond model.styles.block.textAlign '==' 'right'}}margin: 0 0 0 auto; {{/ifCond}}line-height: {{ model.styles.block.lineHeight }}; width: {{ model.styles.block.width }}; background-color: {{ model.styles.block.backgroundColor }}; color: {{ model.styles.block.fontColor }}; font-family: {{fontWithFallback model.styles.block.fontFamily }}; font-size: {{ model.styles.block.fontSize }}; font-weight: {{ model.styles.block.fontWeight }}; border: {{ model.styles.block.borderWidth }} {{ model.styles.block.borderStyle }} {{ model.styles.block.borderColor }}; border-radius: {{ model.styles.block.borderRadius }};\" onClick=\"return false;\">{{ model.text }}</a>
</div>
<div class=\"mailpoet_block_highlight\"></div>
";
    }

    public function getTemplateName()
    {
        return "newsletter/templates/blocks/button/block.hbs";
    }

    public function getDebugInfo()
    {
        return array (  37 => 1,);
    }

    public function getSourceContext()
    {
        return new Source("", "newsletter/templates/blocks/button/block.hbs", "/home/bigfatpharma/public_html/wp-content/plugins/mailpoet/views/newsletter/templates/blocks/button/block.hbs");
    }
}
