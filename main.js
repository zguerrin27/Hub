const getUrl = "https://candidate.hubteam.com/candidateTest/v3/problem/dataset?userKey=86685372c2405a408abba80343f5";

const postUrl = "https://candidate.hubteam.com/candidateTest/v3/problem/result?userKey=86685372c2405a408abba80343f5";

const attendeesList = {
  "countries": []
}

const getHubData = () => {
  axios.get(getUrl).then(res => {
  
    let data = res.data.partners;

    //builds set of countries
    function getCountries(allData){
      let countries = new Set();
      allData.forEach(partner => countries.add(partner.country));
      return countries;
    }
    let countries = getCountries(data);  //set object of all countries

    //builds array of partners by country
    function partnersByCountry(arr, country){
      let partners = []
      arr.forEach(partner => {
        if(partner.country === country){
          partners.push(partner);
        }
      })
      return partners
    }
    let countryPartners = Array.from(countries).map(country => partnersByCountry(data, country)); // convert object to array and get all partners by country

    // handles all logic for building invitation obj per country
    function formCountryAttendanceObj(countryPartners) {

      let countryAttendeeOBJ = {
        "attendeeCount": 0,
        "attendees": [ ],
        "name": "Blank",
        "startDate": "Blank"
      }

      let endDate ='';

      countryAttendeeOBJ["name"] = countryPartners[0].country
      
      //separates all dates into their own array
      const everyDate = countryPartners.reduce((allDates, partner) => {
        partner.availableDates.forEach( date => {
          allDates.push(date);
        })
        return allDates;
      }, [])

      //builds map object of every date and the number of occurances of that date found
      function buildDateAttendanceMap(arr){
        let map = {};
          for(let i = 0; i < arr.length; i++){
            if(!map[arr[i]]){
              map[arr[i]]=1;
            }else{
              ++map[arr[i]];
            }
          }
        return map
      }
      let dateAttendanceMap = buildDateAttendanceMap(everyDate)

      //converts dates/occurances object to array of arrays and sorts by frequency found
      function getSortedHash(obj){
        let entries = Object.entries(obj);
        return dates = entries.sort(function(a, b) {
          if(a[1] > b[1]){
            return a[1] - b[1];
          } else if(a[1] === b[1]){
            return -1 * ( new Date(a[0]) - new Date(b[0]) );
          } else {
            return -1 * a[1] - b[1];
          }
        }).reverse();
      };
      let sortedDateMap = getSortedHash( dateAttendanceMap )
  
      // loops over sortedDateMap and determines if there is a 2 day range..that has the same number of occurances. since its top down order, by occurances then dates, we can assume the top of list has most occurances and dates are first to last
      function findDateAndMaxAttend(sortedDateMap){
        for(let i = 0; i < sortedDateMap.length; i++){
          let parsedDate = new Date(sortedDateMap[i][0]);
            for(let j = 1; j < sortedDateMap.length; j++){
              let parsedDate2 = new Date(sortedDateMap[j][0]);
              if (parsedDate2 - parsedDate === 86400000) {    /* one day in milliseconds */
                if(sortedDateMap[i][1] === sortedDateMap[j][1]){
                  countryAttendeeOBJ["startDate"] = sortedDateMap[i][0];
                  endDate = sortedDateMap[j][0];
                  countryAttendeeOBJ["attendeeCount"] = sortedDateMap[i][1];
                  return;
                }
              }
            }
        }
      }
      findDateAndMaxAttend(sortedDateMap)

      // adds emails of attendees to country invitation object
      function addAttendeeEmails(countryPartners){
        countryPartners.forEach((partner)=>{
          partner.availableDates.forEach((date)=>{
            if(date === countryAttendeeOBJ["startDate"]){
              countryAttendeeOBJ.attendees.push(partner.email)
            }
          })
        })
      }
      addAttendeeEmails(countryPartners)
     
      //push each country obj into list of attendess
      attendeesList.countries.push(countryAttendeeOBJ)

    } // end of formCountryAttendanceObj

    //passes each array of partners into formCountryAttendanceObj() to create object
    countryPartners.forEach( countryPartner => formCountryAttendanceObj(countryPartner));

    console.log(attendeesList)

    // axios.post(postUrl, 
    //   attendeesList
    // ).then(res => {
    //   console.log(res.data)
    // }).catch(err => {
    //   console.log(err, err.response)
    // });
  
  }).catch(err => {
    console.log(err, err.response)
  })
};

document.getElementById('get').addEventListener('click', getHubData)
