<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
	xmlns:html="http://www.w3.org/TR/REC-html40"
	xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
	xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
	<xsl:template match="/">
		<html xmlns="http://www.w3.org/1999/xhtml">
		<head>
			<title>XML Sitemap</title>
			<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
			<style type="text/css">
				body {
					font-family: Helvetica, Arial, sans-serif;
					font-size: 13px;
					color: #475569;
					background: #ffffff;
					margin: 0;
				}
				#content {
					margin: 0 auto;
					width: 1000px;
					max-width: calc(100% - 48px);
					padding: 40px 0 64px;
				}
				h1 {
					color: #0f172a;
					font-size: 28px;
					font-weight: 600;
					margin: 0 0 12px;
				}
				table {
					border: none;
					border-collapse: collapse;
					width: 100%;
				}
				#sitemap tr:nth-child(odd) td {
					background-color: #f8fafc !important;
				}
				#sitemap tbody tr:hover td {
					background-color: #eef4f1;
				}
				#sitemap tbody tr:hover td,
				#sitemap tbody tr:hover td a {
					color: #0f172a;
				}
				.expl {
					margin: 18px 3px;
					line-height: 1.45em;
				}
				.expl a {
					color: #2d6a4f;
					font-weight: 600;
				}
				.expl a:visited {
					color: #25573f;
				}
				a {
					color: #3d5a80;
					text-decoration: none;
				}
				a:visited {
					color: #64748b;
				}
				a:hover {
					text-decoration: underline;
				}
				td {
					font-size: 11px;
					padding: 8px 6px;
				}
				th {
					text-align: left;
					padding-right: 30px;
					padding-bottom: 8px;
					font-size: 11px;
					color: #0f172a;
				}
				thead th {
					border-bottom: 1px solid #0f172a;
				}
			</style>
		</head>
		<body>
		<div id="content">
			<h1>XML Sitemap</h1>
			<p class="expl">
				This is an XML Sitemap, meant for consumption by search engines.<br/>
				You can find more information about XML sitemaps on <a href="https://www.sitemaps.org" target="_blank" rel="noopener">sitemaps.org</a>.
			</p>
			<xsl:if test="count(sitemap:sitemapindex/sitemap:sitemap) &gt; 0">
				<p class="expl">
					This XML Sitemap Index file contains <xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/> sitemaps.
				</p>
				<table id="sitemap" cellpadding="3">
					<thead>
					<tr>
						<th width="75%">Sitemap</th>
						<th width="25%">Last Modified</th>
					</tr>
					</thead>
					<tbody>
					<xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
						<xsl:variable name="sitemapURL">
							<xsl:value-of select="sitemap:loc"/>
						</xsl:variable>
						<tr>
							<td>
								<a href="{$sitemapURL}"><xsl:value-of select="sitemap:loc"/></a>
							</td>
							<td>
								<xsl:value-of select="concat(substring(sitemap:lastmod,0,11),concat(' ', substring(sitemap:lastmod,12,5)),concat(' ', substring(sitemap:lastmod,20,6)))"/>
							</td>
						</tr>
					</xsl:for-each>
					</tbody>
				</table>
			</xsl:if>
			<xsl:if test="count(sitemap:sitemapindex/sitemap:sitemap) &lt; 1">
				<p class="expl">
					This XML Sitemap contains <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs.
				</p>
				<table id="sitemap" cellpadding="3">
					<thead>
					<tr>
						<th width="80%">URL</th>
						<th width="5%">Images</th>
						<th title="Last Modification Time" width="15%">Last Mod.</th>
					</tr>
					</thead>
					<tbody>
					<xsl:for-each select="sitemap:urlset/sitemap:url">
						<tr>
							<td>
								<xsl:variable name="itemURL">
									<xsl:value-of select="sitemap:loc"/>
								</xsl:variable>
								<a href="{$itemURL}">
									<xsl:value-of select="sitemap:loc"/>
								</a>
							</td>
							<td>
								<xsl:value-of select="count(image:image)"/>
							</td>
							<td>
								<xsl:value-of select="concat(substring(sitemap:lastmod,0,11),concat(' ', substring(sitemap:lastmod,12,5)),concat(' ', substring(sitemap:lastmod,20,6)))"/>
							</td>
						</tr>
					</xsl:for-each>
					</tbody>
				</table>
			</xsl:if>
		</div>
		</body>
		</html>
	</xsl:template>
</xsl:stylesheet>
