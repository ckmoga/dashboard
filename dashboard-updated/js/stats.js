
$(document).ready(function()
{

  //Requirements overview jquery  
  $.getJSON('overview.json', function(data) 
  {
   
        $.each(data, function(i, val) 
        {
        $('.overview-data').append('<tr><td>'+val.type.toUpperCase()+'</td>'
            +'<td>'+val.total+'</td><td>'+val.passed+'</td><td>'+val.failed+'</td><td>'+val.pending+'</td>'
            +'<td>'+val.ignored+'</td><td>'+val.untested+'</td></tr>');
        });

  });



      //VARIABLES DECLARATION
      var history;
      var categories1= new Array();
      var count=0;
      var dataArray=[];
      var PassedArray=[];
      var FailedArray=[];
      var PendingArray=[];
      var IgnoredArray=[];
      var total;

      //JSON FILES ARRAY 
      var jsonfile=new Array();
      jsonfile.push('functional');
      jsonfile.push('system');
      jsonfile.push('regression');
      var jsonfile_name;

      for(x=0;x<jsonfile.length;x++)
        {
          
           jsonfile_name=jsonfile[x]+'.json';
           $.getJSON(jsonfile_name, function(data) {
            $.each(data, function(i, val) 
                {
                
                 if(data[i].status.toLowerCase()=="passed")
                 {
                     $('#status-'+i).addClass("text-success");

                 }
                 else if(data[i].status.toLowerCase()=="failed")
                 {
                     $('#status-'+i).addClass("text-danger");
                 }
                 else if(data[i].status.toLowerCase()=="pending")
                 {
                     $('#status-'+i).addClass("text-warning");
                 }
                 else if(data[i].status.toLowerCase()=="ignored")
                 {
                     $('#status-'+i).addClass("text-danger text-ignored");


                 }
                $('#status-'+i).html(data[i].status);
                $('#lastrun-'+i).html(data[i].lastrun+' ');
                var test=data[i].tests;
                $('#total-'+i).html(test.total);
                $('#passed-'+i).html(test.passed);
                var passed_perc=(test.passed/test.total)*100;
                passed_perc=passed_perc.toFixed(2);
                $('#passed_perc-'+i).css('width',passed_perc+'%');
                $('#passed_perc1-'+i).html(passed_perc+'%');
                $('#failed-'+i).html(test.failed);
                var failed_perc=(test.failed/test.total)*100;
                failed_perc=failed_perc.toFixed(2);

               
                $('#failed_perc-'+i).css('width',failed_perc+'%');
                $('#failed_perc1-'+i).html(failed_perc+'%');

                $('#pending-'+i).html(test.pending);
                var pending_perc=(test.pending/test.total)*100;
                pending_perc=pending_perc.toFixed(2);
                $('#pending_perc-'+i).css('width',pending_perc+'%');
                $('#pending_perc1-'+i).html(pending_perc+'%');


                $('#ignored-'+i).html(test.ignored);
                var ignored_perc=(test.ignored/test.total)*100;
                ignored_perc=ignored_perc.toFixed(2);
                $('#ignored_perc-'+i).css('width',ignored_perc+'%');
                $('#ignored_perc1-'+i).html(ignored_perc+'%');
                history=data[i].history;

                count=0;
                total=0;
                $.each(history, function(i, val) 
                {
                 dataArray.push([val.total,val.passed,val.failed,val.pending,val.ignored]);
                 count++;
                 total=parseInt(total+parseInt(val.total));
                 categories1.push(parseInt(i));
                 PassedArray.push(parseInt(val.passed));
                 FailedArray.push(parseInt(val.failed));
                 PendingArray.push(parseInt(val.pending));
                 IgnoredArray.push(parseInt(val.ignored));
                 
                });
                 categories1.reverse();
                 PassedArray.reverse();
                 FailedArray.reverse();
                 PendingArray.reverse();
                 IgnoredArray.reverse();



                


              //high chart jquery

                $(function () {
            $('.dashboard-stastics-'+i).highcharts({
                chart:
                 {
                    type: 'column',
                    backgroundColor: 'transparent',
                    spacingBottom: 45
             
                 },
                
                title: {
                    text: ''
                },
                credits: {
              enabled: false
           },

                xAxis: 
                {

                    max: (count-1),
                    categories: categories1
                },
                yAxis: {
                    gridLineWidth: 0,
                    minorGridLineWidth: 0,
                    min: 0,
                    title: {
                        text: 'Total'
                    },
                    stackLabels: {
                        enabled: true,
                        style: {
                            fontWeight: 'bold',
                            color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                        }
                    }
                },
                legend: {


                     itemStyle: {
                        
                         color: '#A0A0A0',
                          fontSize: '12px',

                      }
                   ,
                      itemHoverStyle: {
                         color: '#FFF'
                      },
                      itemHiddenStyle: {
                         color: '#444'
                      },

                    fontsize:'12px',

                    align: 'center',
                    x: 0,
                    verticalAlign: 'bottom',
                    y: 35,
                    floating: true,
                    backgroundColor: 'transparent',
                    shadow: false,
                    border: 0, 
                    borderRadius: 0, 
                    borderWidth: 0
                },
                tooltip: {
                    formatter: function ()

                     {
                        return '<b>' + this.x + '</b><br/>' +
                            this.series.name + ': ' + this.y + '<br/>' +
                            'Total: ' + this.point.stackTotal;
                    }
                },
                plotOptions: {
                    column: {
                        stacking: 'normal',
                        borderWidth: 0,
                        dataLabels: {
                            enabled: true,
                            color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white',
                            style: {
                                textShadow: false 
                            }
                        }
                    }
                },
                series: 

                [
                {
                    color: '#0f9a00',
                    name: 'Passed',
                    data: PassedArray
                },
                 {
                    color:'#d80000',
                    name: 'Failed',
                    data: FailedArray
                 },
                 {
                    color:'#df6308',
                    name: 'Pending',
                    data: PendingArray
                 }
                 ,
                 {
                    color:'#656565',
                    name: 'Ignored',
                    data: IgnoredArray
                 }
                ]
            });

        });

         //clear array contents
         dataArray=[];
         IgnoredArray=[];
         PendingArray=[];
         FailedArray=[];
         PassedArray=[];
         categories1=[];
           });


      });

   }


 });
