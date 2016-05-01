<?php
  header("Content-Type: application/json");

  $symbol = $_GET["symbol"];
  if (!empty($symbol)) {
    $link = curl_init();
    $url = sprintf("http://www.bseindia.com/stock-share-price/SiteCache/EQHeaderData.aspx?text=%s", $symbol);
    curl_setopt($link, CURLOPT_URL, $url);
    curl_setopt($link, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13");
    curl_setopt($link, CURLOPT_HTTPHEADER, Array("Content-Type: application/x-www-form-urlencoded"));
    curl_setopt($link, CURLOPT_RETURNTRANSFER, true);
    $output = curl_exec($link);
    curl_close($link);

    $nodes = explode("#", $output);

    date_default_timezone_set("Asia/Kolkata");
    $date = sprintf("As on %s | ", date("d M y"));
    if (substr($nodes[3], 0, strlen($date)) === $date) {
      $prices = explode(",", $nodes[6]);
      echo sprintf("{ \"previousClosePrice\": %s, \"openPrice\": %s }", $prices[0], $prices[1]);
    }
    // Only previous close price is needed, open price is not important (as of current implementation)
    // PCP can be obtained looking at yesterday's data also
    else if (substr($nodes[3], -9) === '| 16:00@C') {
      $prices = explode(",", $nodes[6]);
      echo sprintf("{ \"previousClosePrice\": %s }", $prices[4]);
    }
    else {
      echo "{ \"error\": \"data is invalid or for a prior date\" }";
    }
  }
  else {
    echo "{ \"error\": \"symbol is not defined\" }";
  }

 ?>
