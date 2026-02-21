# Project 1: Static Website with CloudFront + S3 + Route53

resource "aws_s3_bucket" "website" {
  bucket = "mycompany-website-prod"
  tags   = { Name = "website-bucket", Project = "static-site" }
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id
  index_document {
    suffix = "index.html"
  }
  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "CloudFrontAccess"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.website.arn}/*"
    }]
  })
}

resource "aws_cloudfront_distribution" "website" {
  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3-website"
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-website"
    viewer_protocol_policy = "redirect-to-https"
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.website.arn
    ssl_support_method  = "sni-only"
  }

  tags = { Name = "website-cdn", Project = "static-site" }
}

resource "aws_acm_certificate" "website" {
  domain_name       = "www.example.com"
  validation_method = "DNS"
  tags              = { Name = "website-cert", Project = "static-site" }
}

resource "aws_route53_zone" "main" {
  name = "example.com"
  tags = { Name = "main-zone", Project = "static-site" }
}

resource "aws_route53_record" "website" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.example.com"
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_wafv2_web_acl" "website" {
  name  = "website-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "website-waf"
    sampled_requests_enabled   = true
  }

  tags = { Name = "website-waf", Project = "static-site" }
}
